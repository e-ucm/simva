/**
 * Shared helpers for database migrations.
 *
 * Migrations must be idempotent: they can be retried on a database where they
 * were already (partially) applied. These helpers let a migration look at the
 * current schema before altering it instead of blindly issuing DDL that fails
 * when the object already exists (or is missing).
 *
 * This file lives outside `src/lib/migrations` on purpose: Umzug loads every
 * `*.{ts,js}` file in that folder as a migration, so shared code must not be
 * placed there.
 *
 * @module migrationHelpers
 */

import fs from 'fs';
import path from 'path';
import { RunnableMigration, Umzug } from 'umzug';
import { QueryInterface, QueryTypes, Transaction } from 'sequelize';

/**
 * Check whether a table has a given column.
 *
 * @param sequelize - Sequelize instance (from `queryInterface.sequelize`)
 * @param table - Table name
 * @param column - Column name
 * @param transaction - Optional transaction to run the check in
 * @returns `true` if the column exists
 */
export async function hasColumn(
  sequelize: QueryInterface['sequelize'],
  table: string,
  column: string,
  transaction?: Transaction
): Promise<boolean> {
  const rows = await sequelize.query(`PRAGMA table_info(\`${table}\`);`, {
    type: QueryTypes.SELECT,
    transaction,
  });
  return (rows as Array<{ name: string }>).some((row) => row.name === column);
}

/**
 * Check whether a table exists.
 *
 * @param sequelize - Sequelize instance (from `queryInterface.sequelize`)
 * @param table - Table name
 * @returns `true` if the table exists
 */
export async function tableExists(
  sequelize: QueryInterface['sequelize'],
  table: string
): Promise<boolean> {
  const rows = (await sequelize.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = :table;`,
    { type: QueryTypes.SELECT, replacements: { table } }
  )) as Array<{ name: string }>;
  return rows.length > 0;
}

/**
 * Runs SQLite table rebuilds on one connection with foreign-key actions off.
 * Callers must not create a managed Sequelize transaction inside this callback.
 */
export async function withSqliteForeignKeysDisabled<T>(
  sequelize: QueryInterface['sequelize'],
  callback: () => Promise<T>
): Promise<T> {
  let transactionStarted = false;

  try {
    await sequelize.query('PRAGMA foreign_keys = OFF');
    const foreignKeyRows = (await sequelize.query('PRAGMA foreign_keys', {
      type: QueryTypes.SELECT,
    })) as Array<{ foreign_keys: number }>;

    if (foreignKeyRows[0]?.foreign_keys !== 0) {
      throw new Error('Could not disable SQLite foreign-key enforcement before rebuilding tables');
    }

    await sequelize.query('BEGIN');
    transactionStarted = true;
    await sequelize.query('PRAGMA defer_foreign_keys = ON');

    const result = await callback();
    await sequelize.query('COMMIT');
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      await sequelize.query('ROLLBACK');
    }
    throw error;
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
}

/**
 * Selects one runnable file for each extension-independent migration name.
 * Sorted names make `.js` win over `.ts` when both files are deployed.
 */
export function selectMigrationFiles(files: readonly string[]): Array<{ name: string; file: string }> {
  const migrations = new Map<string, string>();

  for (const file of [...files].sort()) {
    if (file.endsWith('.d.ts')) {
      continue;
    }

    const extension = path.extname(file);
    if (extension !== '.js' && extension !== '.ts') {
      continue;
    }

    const name = file.slice(0, -extension.length);
    if (!migrations.has(name)) {
      migrations.set(name, file);
    }
  }

  return [...migrations].map(([name, file]) => ({ name, file }));
}

/**
 * Resolves migrations with extension-independent names so compiled files do
 * not re-run after their TypeScript sources have already run.
 */
export async function resolveMigrationsFromFolder<T extends object>(
  folder: string,
  context: T
): Promise<RunnableMigration<T>[]> {
  return selectMigrationFiles(fs.readdirSync(folder)).map(({ name, file }) =>
    Umzug.defaultResolver({ name, path: path.join(folder, file), context }) as RunnableMigration<T>
  );
}

/**
 * Collapses legacy Umzug records that used a complete filename, including
 * duplicate `.ts` and `.js` records for the same logical migration.
 */
export async function normalizeSequelizeMeta(sequelize: QueryInterface['sequelize']): Promise<void> {
  if (!(await tableExists(sequelize, 'SequelizeMeta'))) {
    return;
  }

  await sequelize.query(`
    INSERT OR IGNORE INTO "SequelizeMeta" ("name")
    SELECT DISTINCT substr("name", 1, length("name") - 3)
    FROM "SequelizeMeta"
    WHERE "name" LIKE '%.ts' OR "name" LIKE '%.js';
  `);
  await sequelize.query(`
    DELETE FROM "SequelizeMeta"
    WHERE "name" LIKE '%.ts' OR "name" LIKE '%.js';
  `);
}
