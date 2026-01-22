import { Sequelize, Model } from "sequelize";

export class Activity extends Model {
  declare session_id: number;
  declare activity_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare presignedUrl: string | null;
  declare generated_at: Date | null;
  declare expire_on_seconds: number | null;
  declare trace_storage: boolean;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function ActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Activity.init({
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "manual", "limesurvey", "gameplay", "lti_tool"]],
      },
    },
    presignedUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expire_on_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trace_storage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "Activities",
    timestamps: true,
    freezeTableName: true,
  });

  return Activity;
};