
import { QueryInterface, DataTypes } from 'sequelize';
import { hasColumn, withSqliteForeignKeysDisabled } from '../migrationHelpers';

export async function up({ context }: { context: QueryInterface }) {
    const sequelize = context.sequelize;
    await withSqliteForeignKeysDisabled(sequelize, async () => {
        const removals: Array<[string, string]> = [
            ['Activities', 'mongo_id'],
            ['Sessions', 'mongo_id'],
            ['SIMLETs', 'mongo_id'],
            ['Users', 'mongo_id']
        ];

        for (const [table, column] of removals) {
            if (await hasColumn(sequelize, table, column)) {
                await context.removeColumn(table, column);
            }
        }
    });
}

export async function down({ context }: { context: QueryInterface }) {
    const sequelize = context.sequelize;
    const additions: Array<[string, string]> = [
        ['Users', 'mongo_id'],
        ['SIMLETs', 'mongo_id'],
        ['Sessions', 'mongo_id'],
        ['Activities', 'mongo_id']
    ];

    for (const [table, column] of additions) {
        if (!(await hasColumn(sequelize, table, column))) {
            await context.addColumn(table, column, {
                type: DataTypes.STRING,
                allowNull: true
            });
        }
    }
}

/*
    * This migration removes the 'mongo_id' column from the Activities, Sessions, SIMLETs, and Users tables.
    * The 'mongo_id' column was previously used to store references to MongoDB documents, but is no longer needed after the migration of trace data to Minio and the removal of MongoDB dependencies.
    * ParticipantGroups.mongo_id and group_allocator_mongo_id are preserved to support data migration from MongoDB backups.
    *
     * Sequelize's removeColumn implementation for SQLite works by creating a backup table without the column, copying the data, dropping the original table and recreating it. With foreign keys enabled, DROP TABLE performs an implicit DELETE that runs ON DELETE CASCADE actions. The shared helper disables FKs, verifies that state, and starts a manual transaction on the same connection before rebuilding, so child rows are preserved.
    *
    * Both up and down are idempotent: columns are only dropped/added if they exist/are missing, so a partially applied migration can be retried safely.
    * Caution: Running this migration will permanently remove the 'mongo_id' data from the database. Make sure to back up your database before running this migration if you need to preserve that data.
    */
