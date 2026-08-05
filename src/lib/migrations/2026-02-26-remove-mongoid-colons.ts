
import { QueryInterface, DataTypes, Transaction } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
    await context.sequelize.query('PRAGMA foreign_keys = OFF;');
    const t: Transaction = await context.sequelize.transaction();
    try {
        // Remove mongo_id columns in FK-safe order for SQLite
        await context.removeColumn('ParticipantGroups', 'mongo_id', { transaction: t });
        await context.removeColumn('Activities', 'mongo_id', { transaction: t });
        await context.removeColumn('Sessions', 'mongo_id', { transaction: t });
        await context.removeColumn('SIMLETs', 'mongo_id', { transaction: t });
        await context.removeColumn('Users', 'mongo_id', { transaction: t });
        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
    await context.sequelize.query('PRAGMA foreign_keys = ON;');
}

export async function down({ context }: { context: QueryInterface }) {
    const t: Transaction = await context.sequelize.transaction();
    try {
        // Add mongo_id columns back in reverse order
        await context.addColumn('Users', 'mongo_id', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction: t });
        await context.addColumn('SIMLETs', 'mongo_id', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction: t });
        await context.addColumn('Sessions', 'mongo_id', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction: t });
        await context.addColumn('Activities', 'mongo_id', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction: t });
        await context.addColumn('ParticipantGroups', 'mongo_id', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction: t });
        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

/*
    * This migration removes the 'mongo_id' column from the Allocators, ParticipantGroups, SIMLETs, Sessions, Activities, and Users tables.
    * The 'mongo_id' column was previously used to store references to MongoDB documents, but is no longer needed after the migration of trace data to Minio and the removal of MongoDB dependencies.
    *   
    *  In SQLite, the ALTER TABLE ... DROP COLUMN command is not natively supported for older versions, and even in newer versions, it has limitations. Sequelize's removeColumn implementation for SQLite works by:

Creating a backup table without the column to be removed.
Copying data from the original table to the backup table.
Dropping the original table.
Renaming the backup table to the original name.
    *  This process can be time-consuming for large tables, which is why we wrap the operations in a transaction to ensure data integrity. The migration also includes a down function to re-add the 'mongo_id' columns if needed, although these will be empty since the original data has been removed.
    *  Note: The down function adds the 'mongo_id' columns back to the tables, but does not restore any data that was previously in those columns. If you need to restore data, you would need to implement additional logic to handle that.
    *  Caution: Running this migration will permanently remove the 'mongo_id' data from the database. Make sure to back up your database before running this migration if you need to preserve that data.
    *  This migration is part of the ongoing effort to remove MongoDB dependencies and clean up the database schema after migrating trace data to Minio.
    */      