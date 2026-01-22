import { Sequelize, Model } from "sequelize";

export class ActivityTemplatePermissions extends Model {
  declare activity_template_id: number;
  declare user_id: number;
  declare permission: "read" | "WRITE";
}

export function ActivityTemplatePermissionsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplatePermissions.init({
    activity_template_id: {
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
    modelName: "ActivityTemplatePermissions",
    tableName: "Activities_template_permissions",
    timestamps: false,
  });

  return ActivityTemplatePermissions;
}