import { QueryInterface, DataTypes, Transaction, Sequelize } from 'sequelize';
import { logger } from '../logger';
import { config } from '../config';

export async function up({ context }: { context: QueryInterface }) {
    const t: Transaction = await context.sequelize.transaction();
    try {
      await context.addColumn('GamePlay_Activities', 'game_tracker_technology', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction : t });
    await context.addColumn('GamePlay_Activities', 'game_technology', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction : t });
      await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

export async function down({ context }: { context: QueryInterface }) {
  const t: Transaction = await context.sequelize.transaction();
  try {
    await context.removeColumn('GamePlay_Activities', 'game_tracker_technology', {
        type: DataTypes.STRING,
        allowNull: true,
    }, { transaction : t });
    await context.removeColumn('GamePlay_Activities', 'game_technology', {
        type: DataTypes.STRING,
        allowNull: true,
    }, { transaction : t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}