import { QueryInterface, DataTypes, Transaction, Sequelize } from 'sequelize';
import { logger } from '../logger';
import { config } from '../config';

export async function up({ context }: { context: QueryInterface }) {
    const tables = [
      'Users',
      'ParticipantGroups',
      'ParticipantGroups_participants',
      'Activities',
      'Activities_completion',
      'Manual_Activities',
      'GamePlay_Activities',
      'Limesurvey_Activities',
      'SIMLETs',
      'SIMLETs_permissions',
      'SIMLETs_shlinks',
      'Sessions',
      'Sessions_dates',
      'Sessions_permissions',
      'Sessions_tags',
      'Sessions_tags_list',
      'Experimental_Groups',
      'Experimental_Participants',
      'Random_Allocators',
      'Activities_template',
      'Activities_template_permissions',
      'Activities_template_tags',
      'Activities_template_tags_list',
      'GamePlay_Activities_Template',
      'Limesurvey_Activities_Template',
      'Manual_Template_Activities',
    ];

    const t: Transaction = await context.sequelize.transaction();
    try {
      for (const table of tables) {
        await context.addColumn(table, 'deletedAt', {
          type: DataTypes.DATE,
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
  const tables = [
      'Users',
      'ParticipantGroups',
      'ParticipantGroups_participants',
      'Activities',
      'Activities_completion',
      'Manual_Activities',
      'GamePlay_Activities',
      'Limesurvey_Activities',
      'SIMLETs',
      'SIMLETs_permissions',
      'SIMLETs_shlinks',
      'Sessions',
      'Sessions_dates',
      'Sessions_permissions',
      'Sessions_tags',
      'Sessions_tags_list',
      'Experimental_Groups',
      'Experimental_Participants',
      'Random_Allocators',
      'Activities_template',
      'Activities_template_permissions',
      'Activities_template_tags',
      'Activities_template_tags_list',
      'GamePlay_Activities_Template',
      'Limesurvey_Activities_Template',
      'Manual_Template_Activities',
  ];

  const t: Transaction = await context.sequelize.transaction();
  try {
    for (const table of tables) {
      await context.removeColumn(table, 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, { transaction : t });
    }
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}