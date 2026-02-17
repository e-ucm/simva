import { Sequelize, Model } from "sequelize";

export class SimletPermissions extends Model {
  declare simlet_id: number;
  declare user_id: number;
  declare permission: "READ" | "WRITE";
}

export function SimletPermissionsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletPermissions.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    permission: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["READ", "WRITE"]],
      },
    },
  }, {
    sequelize,
    modelName: "SimletPermissions",
    tableName: "SIMLETs_permissions",
    timestamps: false,
  });

  return SimletPermissions;
}