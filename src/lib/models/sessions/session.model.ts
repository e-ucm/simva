import { Sequelize, Model } from "sequelize";

export class Session extends Model {
  declare simlet_id: number;
  declare session_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare experimental_method: string | null;
  declare active: boolean | null;
  declare session_start_date: Date | null;
  declare session_end_date: Date | null;
  declare session_supervisor_id: number;
}

export function SessionFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Session.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_id: {
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
    description: {
      type: DataTypes.STRING,
      allowNull: false,
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
    },
    experimental_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    session_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "Session",
    tableName: "Sessions",
    timestamps: true,
  });

  return Session;
}