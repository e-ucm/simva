import { Sequelize, Model } from "sequelize";

export class ActivityCompletion extends Model {
  declare activity_id: number;
  declare participant_id: number;
  declare activity_initialized: boolean;
  declare activity_completed: boolean;
  declare activity_progress: number | null;
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
    activity_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    activity_progress: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "ActivityCompletion",
    tableName: "Activities_completion",
    timestamps: false,
  });

  return ActivityCompletion;
}