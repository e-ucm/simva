import { Sequelize, Model } from "sequelize";

export class SessionPermissions extends Model {
  declare session_id: number;
  declare user_id: number;
  declare permission: "read" | "WRITE";
}

export function SessionPermissionsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionPermissions.init({
    session_id: {
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
        isIn: [["read", "WRITE"]],
      },
    },
  }, {
    sequelize,
    modelName: "SessionPermissions",
    tableName: "Sessions_permissions",
    timestamps: false,
  });

  return SessionPermissions;
}