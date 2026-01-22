import { Sequelize, Model } from "sequelize";

export class ActivityCompletion extends Model {
  declare activity_id: number;
  declare participant_id: number;
  declare initialized: boolean;
  declare completed: boolean;
  declare progress: number | null;
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
    initialized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    progress: {
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