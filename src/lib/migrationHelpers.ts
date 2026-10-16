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
