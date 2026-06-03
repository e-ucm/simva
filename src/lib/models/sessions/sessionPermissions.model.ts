import { Sequelize, Model } from "sequelize";

export class SessionPermissions extends Model {
  declare session_id: number;
  declare user_id: number;
  declare permission: "READ" | "WRITE";
  declare createdAt: Date;
  declare updatedAt: Date;
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
        isIn: [["READ", "WRITE"]],
      },
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
    modelName: "SessionPermissions",
    tableName: "Sessions_permissions",
    timestamps: true,
  });

  return SessionPermissions;
}