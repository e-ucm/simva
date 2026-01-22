import { Sequelize, Model } from "sequelize";

export class SimletGroups extends Model {
  declare simlet_id: number;
  declare group_id: number;
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
  }, {
    sequelize,
    modelName: "SimletGroups",
    tableName: "SIMLETs_groups",
    timestamps: false,
  });

  return SimletGroups;
}