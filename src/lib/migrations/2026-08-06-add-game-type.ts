import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { logger } from '../logger';
import { hasColumn } from '../migrationHelpers';

export const GAME_TYPE_COLUMNS = ['game_tracker_technology', 'game_technology'];

export async function up({ context }: { context: QueryInterface }) {
    const sequelize = context.sequelize;
    const t: Transaction = await sequelize.transaction();
    try {
      for (const column of GAME_TYPE_COLUMNS) {
        if (await hasColumn(sequelize, 'GamePlay_Activities', column, t)) {
          logger.debug(`Column '${column}' already exists on table 'GamePlay_Activities', skipping`);
          continue;
        }
        await context.addColumn('GamePlay_Activities', column, {
          type: DataTypes.STRING,
          allowNull: true,
        }, { transaction : t });
      }
      await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

export async function down({ context }: { context: QueryInterface }) {
  const sequelize = context.sequelize;
  const t: Transaction = await sequelize.transaction();
  try {
    for (const column of GAME_TYPE_COLUMNS) {
      if (!(await hasColumn(sequelize, 'GamePlay_Activities', column, t))) {
        logger.debug(`Column '${column}' does not exist on table 'GamePlay_Activities', skipping`);
        continue;
      }
      await context.removeColumn('GamePlay_Activities', column, { transaction : t });
    }
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}
