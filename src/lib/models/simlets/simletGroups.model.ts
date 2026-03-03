import { NotFoundError } from "@/lib/errors/appErrors";
import { Sequelize, Model } from "sequelize";

export class SimletGroups extends Model {
  declare simlet_id: number;
  declare group_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function SimletGroupsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletGroups.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
  }, {
    sequelize,
    modelName: "SimletGroups",
    tableName: "SIMLETs_groups",
    timestamps: true,
  });

  return SimletGroups;
}