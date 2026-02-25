import { Sequelize, Model } from "sequelize";

export class ActivityCompletion extends Model {
  declare activity_id: number;
  declare participant_id: number;
    declare activity_initialized: boolean;
    declare activity_progress: number | null;
    declare activity_completed: boolean;
    declare activity_completion_date: Date | null;
    declare activity_suspended: boolean;
    declare activity_initialization_date: Date | null;
    declare activity_suspension_date: Date | null;
    declare activity_registration_id: string | null;
}

export function ActivityCompletionFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
    ActivityCompletion.init({
      activity_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      participant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      activity_initialized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activity_initialization_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_progress: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      activity_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activity_completion_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_suspended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activity_suspension_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_registration_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
    }
  }, {
    sequelize,
    modelName: "ActivityCompletion",
    tableName: "Activities_completion",
    timestamps: false,
  });

  return ActivityCompletion;
}