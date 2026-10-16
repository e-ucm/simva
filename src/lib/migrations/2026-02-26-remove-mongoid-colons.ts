
import { QueryInterface, DataTypes, QueryTypes, Transaction } from 'sequelize';

async function hasColumn(
    sequelize: QueryInterface['sequelize'],
    table: string,
    column: string,
    transaction?: Transaction
): Promise<boolean> {
    const rows = await sequelize.query(`PRAGMA table_info(\`${table}\`);`, {
        type: QueryTypes.SELECT,
        transaction
    });
    return (rows as Array<{ name: string }>).some((row) => row.name === column);
}

export async function up({ context }: { context: QueryInterface }) {
    const sequelize = context.sequelize;
    // Best effort: may be a no-op inside a transaction, so we also defer FK
    // enforcement below, which works within the transaction.
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    const t: Transaction = await sequelize.transaction();
    try {
        // Defers all foreign key checks to COMMIT, so the table rebuilds done by
        // removeColumn (create new -> copy -> DROP TABLE -> rename) can run even
        // when other tables reference the table being rebuilt.
        await sequelize.query('PRAGMA defer_foreign_keys = ON;', { transaction: t });

        const removals: Array<[string, string]> = [
            ['ParticipantGroups', 'mongo_id'],
            ['Activities', 'mongo_id'],
            ['Sessions', 'mongo_id'],
            ['SIMLETs', 'mongo_id'],
            ['Users', 'mongo_id'],
            ['ParticipantGroups', 'group_allocator_mongo_id']
        ];

        for (const [table, column] of removals) {
            if (await hasColumn(sequelize, table, column, t)) {
                await context.removeColumn(table, column, { transaction: t });
            }
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
    await sequelize.query('PRAGMA foreign_keys = ON;');
}

export async function down({ context }: { context: QueryInterface }) {
    const sequelize = context.sequelize;
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    const t: Transaction = await sequelize.transaction();
    try {
        await sequelize.query('PRAGMA defer_foreign_keys = ON;', { transaction: t });

        const additions: Array<[string, string]> = [
            ['Users', 'mongo_id'],
            ['SIMLETs', 'mongo_id'],
            ['Sessions', 'mongo_id'],
            ['Activities', 'mongo_id'],
            ['ParticipantGroups', 'mongo_id'],
            ['ParticipantGroups', 'group_allocator_mongo_id']
        ];

        for (const [table, column] of additions) {
            if (!(await hasColumn(sequelize, table, column, t))) {
                await context.addColumn(table, column, {
                    type: DataTypes.STRING,
                    allowNull: true
                }, { transaction: t });
            }
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
    await sequelize.query('PRAGMA foreign_keys = ON;');
}

/*
    * This migration removes the 'mongo_id' column from the ParticipantGroups, Activities, Sessions, SIMLETs, and Users tables.
    * The 'mongo_id' column was previously used to store references to MongoDB documents, but is no longer needed after the migration of trace data to Minio and the removal of MongoDB dependencies.
    *
    * Sequelize's removeColumn implementation for SQLite works by creating a backup table without the column, copying the data, dropping the original table and renaming the backup. Dropping a table that other tables reference fails with "FOREIGN KEY constraint failed" unless FK enforcement is off, and `PRAGMA foreign_keys = OFF` is a no-op once a transaction has started. To make the rebuild safe the migration sets `PRAGMA defer_foreign_keys = ON` inside the transaction, which postpones all FK checks until COMMIT, at which point every table has been rebuilt with its data intact.
    *
    * Both up and down are idempotent: columns are only dropped/added if they exist/are missing, so a partially applied migration can be retried safely.
    * Caution: Running this migration will permanently remove the 'mongo_id' data from the database. Make sure to back up your database before running this migration if you need to preserve that data.
    */
