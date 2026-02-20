import { Sequelize, Model } from "sequelize";

export class ActivityCompletion extends Model {
  declare activity_id: number;
  declare participant_id: number;
  declare activity_initialized : boolean;
  declare activity_progress: number;
  declare activity_suspended: boolean;
  declare activity_initialization_date: Date;
  declare activity_suspension_date: Date;
  declare activity_completion_date: Date;
  declare activity_registration_id: string;
  declare activity_completed : boolean;
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
    activity_suspended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    activity_initialization_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activity_suspension_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activity_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activity_registration_id: {
      type: DataTypes.STRING,
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