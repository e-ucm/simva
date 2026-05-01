import { QueryInterface, QueryTypes } from 'sequelize';
import { logger } from '../logger';

type ForeignKeyInfo = {
  table?: string;
};

type TableExistsRow = {
  name: string;
};

export async function up({ context }: { context: QueryInterface }) {
  const sequelize = context.sequelize;

  const fkRowsRaw = await sequelize.query("PRAGMA foreign_key_list('Sessions_tags');", {
    type: QueryTypes.SELECT,
  });
  const fkRows = Array.isArray(fkRowsRaw) ? (fkRowsRaw as ForeignKeyInfo[]) : [];
  const hasLegacyTagsListFk = fkRows.some((row) => String(row.table || '').toLowerCase() === 'tags_list');

  if (!hasLegacyTagsListFk) {
    logger.info('Sessions_tags foreign key is already correct. Skipping migration.');
    return;
  }

  const sessionTagsListTableRaw = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Sessions_tags_list';",
    { type: QueryTypes.SELECT }
  );
  const sessionTagsListTable = Array.isArray(sessionTagsListTableRaw)
    ? (sessionTagsListTableRaw as TableExistsRow[])
    : [];

  if (sessionTagsListTable.length === 0) {
    throw new Error('Cannot repair Sessions_tags foreign key: table Sessions_tags_list does not exist');
  }

  logger.warn('Repairing Sessions_tags foreign key reference from tags_list to Sessions_tags_list');

  await sequelize.query('PRAGMA foreign_keys = OFF;');
  try {
    await sequelize.query('ALTER TABLE Sessions_tags RENAME TO Sessions_tags_old;');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Sessions_tags (
        session_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, tag_id),
        FOREIGN KEY (session_id) REFERENCES Sessions(session_id),
        FOREIGN KEY (tag_id) REFERENCES Sessions_tags_list(tag_id)
      );
    `);

    await sequelize.query(`
      INSERT INTO Sessions_tags (session_id, tag_id, createdAt, updatedAt)
      SELECT session_id, tag_id, createdAt, updatedAt
      FROM Sessions_tags_old;
    `);

    await sequelize.query('DROP TABLE Sessions_tags_old;');
    await sequelize.query('CREATE INDEX IF NOT EXISTS Sessions_tags_index_0 ON Sessions_tags (tag_id);');

    logger.info('Sessions_tags foreign key repaired successfully');
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON;');
  }
}

export async function down(_args: { context: QueryInterface }) {
  // This is a one-way compatibility repair for legacy SQLite schemas.
}
