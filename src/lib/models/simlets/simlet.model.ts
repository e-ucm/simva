import { Sequelize, Model } from "sequelize";

export class Simlet extends Model {
  declare simlet_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare sandbox_session_id: number | null;
  declare description: string;
  declare objective: string | null;
  declare allocator_id: number;
  declare simlet_coordinator_id: number;
}

export function SimletFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Simlet.init({
    simlet_id: {
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
    sandbox_session_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    objective: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allocator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    simlet_coordinator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "Simlet",
    tableName: "SIMLETs",
    timestamps: true,
  });

  return Simlet;
}