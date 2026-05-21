import { Sequelize, Model } from "sequelize";

export class ExperimentalGroups extends Model {
  declare simlet_id: number;
  declare group_id: number;
  declare session_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function ExperimentalGroupsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ExperimentalGroups.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
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
  }, {
    sequelize,
    modelName: "ExperimentalGroups",
    tableName: "Experimental_Groups",
    timestamps: true,
    updatedAt: "updatedAt",
    createdAt: "createdAt",
  });
  return ExperimentalGroups;
}
