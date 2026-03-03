import { Sequelize, Model } from "sequelize";

export class ActivityCompletion extends Model {
  declare activity_id: number;
  declare participant_id: number;
    declare activity_initialized: boolean;
    declare activity_initialization_date: Date | null;
    declare activity_progress: number | null;
    declare activity_completed: boolean;
    declare activity_completion_date: Date | null;
    declare activity_suspended: boolean;
    declare activity_suspension_date: Date | null;
    declare activity_registration_id: string | null;
    declare activity_result_presigned_url: string | null;
    declare activity_result_presigned_url_generated_at: Date | null;
    declare activity_result_presigned_url_expire_at: Date | null;
    declare createdAt: Date;
    declare updatedAt: Date;
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
    },
      activity_result_presigned_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      activity_result_presigned_url_generated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_result_presigned_url_expire_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: "ActivityCompletion",
    tableName: "Activities_completion",
    timestamps: true,
  });

  return ActivityCompletion;
}