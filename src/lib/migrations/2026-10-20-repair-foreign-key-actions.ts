import { QueryInterface, QueryTypes } from 'sequelize';
import { logger } from '../logger';
import { tableExists, withSqliteForeignKeysDisabled } from '../migrationHelpers';

type ForeignKeyDefinition = {
  from: string;
  table: string;
  to: string;
  onUpdate: string;
  onDelete: string;
};

type ForeignKeyRow = {
  from: string;
  table: string;
  to: string | null;
  on_update: string;
  on_delete: string;
};

export const EXPECTED_FOREIGN_KEYS: Record<string, ForeignKeyDefinition[]> = {
  Activities: [
    {
      from: 'session_id',
      table: 'Sessions',
      to: 'session_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  ],
  SIMLETs: [
    {
      from: 'simlet_supervisor_id',
      table: 'Users',
      to: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  ],
  Sessions: [
    {
      from: 'simlet_id',
      table: 'SIMLETs',
      to: 'simlet_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    {
      from: 'session_coordinator_id',
      table: 'Users',
      to: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    {
      from: 'session_sandbox_user_id',
      table: 'Users',
      to: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  ],
  Sessions_tags: [
    {
      from: 'tag_id',
      table: 'Sessions_tags_list',
      to: 'tag_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    {
      from: 'session_id',
      table: 'Sessions',
      to: 'session_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  ],
};

function foreignKeySignature(foreignKey: ForeignKeyDefinition): string {
  return [
    foreignKey.from,
    foreignKey.table,
    foreignKey.to,
    foreignKey.onUpdate.toUpperCase(),
    foreignKey.onDelete.toUpperCase(),
  ].join('|');
}

async function foreignKeys(
  sequelize: QueryInterface['sequelize'],
  table: string
): Promise<ForeignKeyDefinition[]> {
  const rows = (await sequelize.query(`PRAGMA foreign_key_list(\`${table}\`);`, {
    type: QueryTypes.SELECT,
  })) as ForeignKeyRow[];

  return rows.map((row) => ({
    from: row.from,
    table: row.table,
    to: row.to ?? '',
    onUpdate: row.on_update,
    onDelete: row.on_delete,
  }));
}

function foreignKeysMatch(
  actual: ForeignKeyDefinition[],
  expected: ForeignKeyDefinition[]
): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  const actualSignatures = actual.map(foreignKeySignature).sort();
  const expectedSignatures = expected.map(foreignKeySignature).sort();
  return actualSignatures.every((signature, index) => signature === expectedSignatures[index]);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function foreignKeySql(foreignKey: ForeignKeyDefinition): string {
  return `FOREIGN KEY (${quoteIdentifier(foreignKey.from)}) REFERENCES ${quoteIdentifier(foreignKey.table)}(${quoteIdentifier(foreignKey.to)}) ON UPDATE ${foreignKey.onUpdate} ON DELETE ${foreignKey.onDelete}`;
}

function ddlWithCorrectForeignKeys(
  ddl: string,
  expectedForeignKeys: ForeignKeyDefinition[]
): string {
  const foreignKeyActions = '(?:\\s+ON\\s+(?:DELETE|UPDATE)\\s+(?:CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT))*';
  const sqlIdentifier = '(?:["`][^"`]+["`]|\\w+)';
  const tableForeignKeys = new RegExp(
    `,\\s*FOREIGN\\s+KEY\\s*\\([^)]*\\)\\s*REFERENCES\\s+${sqlIdentifier}\\s*\\([^)]*\\)${foreignKeyActions}`,
    'gi'
  );
  const inlineReferences = new RegExp(
    `\\s+REFERENCES\\s+${sqlIdentifier}\\s*\\([^)]*\\)${foreignKeyActions}`,
    'gi'
  );

  let normalizedDdl = ddl.replace(tableForeignKeys, '').replace(inlineReferences, '').trim();
  if (normalizedDdl.endsWith(';')) {
    normalizedDdl = normalizedDdl.slice(0, -1).trimEnd();
  }

  const closingParenthesis = normalizedDdl.lastIndexOf(')');
  if (closingParenthesis === -1) {
    throw new Error('Cannot repair foreign keys: table definition has no closing parenthesis');
  }

  const tableBody = normalizedDdl.slice(0, closingParenthesis).trimEnd();
  const separator = tableBody.endsWith(',') ? '\n  ' : ',\n  ';
  const foreignKeysSql = expectedForeignKeys.map(foreignKeySql).join(',\n  ');
  return `${tableBody}${separator}${foreignKeysSql}\n${normalizedDdl.slice(closingParenthesis)}`;
}

async function rebuildTableWithCorrectForeignKeys(
  sequelize: QueryInterface['sequelize'],
  table: string,
  expectedForeignKeys: ForeignKeyDefinition[]
): Promise<void> {
  const tableRows = (await sequelize.query(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = :table;`,
    { type: QueryTypes.SELECT, replacements: { table } }
  )) as Array<{ sql: string | null }>;
  const tableSql = tableRows[0]?.sql;
  if (!tableSql) {
    throw new Error(`Cannot repair foreign keys: table ${table} has no SQLite definition`);
  }

  const indexRows = (await sequelize.query(
    `SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = :table AND sql IS NOT NULL;`,
    { type: QueryTypes.SELECT, replacements: { table } }
  )) as Array<{ sql: string }>;
  const backupTable = `${table}_foreign_key_backup`;

  await sequelize.query(`CREATE TABLE ${quoteIdentifier(backupTable)} AS SELECT * FROM ${quoteIdentifier(table)};`);
  await sequelize.query(`DROP TABLE ${quoteIdentifier(table)};`);
  await sequelize.query(ddlWithCorrectForeignKeys(tableSql, expectedForeignKeys));
  await sequelize.query(`INSERT INTO ${quoteIdentifier(table)} SELECT * FROM ${quoteIdentifier(backupTable)};`);
  await sequelize.query(`DROP TABLE ${quoteIdentifier(backupTable)};`);

  for (const index of indexRows) {
    await sequelize.query(index.sql);
  }
}

export async function up({ context }: { context: QueryInterface }) {
  const sequelize = context.sequelize;
  const tablesToRepair: Array<[string, ForeignKeyDefinition[]]> = [];

  for (const [table, expectedForeignKeys] of Object.entries(EXPECTED_FOREIGN_KEYS)) {
    if (!(await tableExists(sequelize, table))) {
      logger.warn(`Table ${table} does not exist, skipping foreign-key repair`);
      continue;
    }

    if (foreignKeysMatch(await foreignKeys(sequelize, table), expectedForeignKeys)) {
      logger.info(`Foreign keys on ${table} are already correct, skipping repair`);
      continue;
    }

    tablesToRepair.push([table, expectedForeignKeys]);
  }

  if (tablesToRepair.length === 0) {
    return;
  }

  await withSqliteForeignKeysDisabled(sequelize, async () => {
    for (const [table, expectedForeignKeys] of tablesToRepair) {
      await rebuildTableWithCorrectForeignKeys(sequelize, table, expectedForeignKeys);
      logger.info(`Repaired foreign-key actions on ${table}`);
    }
  });
}

export async function down(_args: { context: QueryInterface }) {
  // This migration restores schema actions lost by an earlier SQLite rebuild.
}
