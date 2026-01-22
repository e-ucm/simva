import { Sequelize, Model } from "sequelize";

export class GroupPermissions extends Model {
  declare group_id: number;
  declare user_id: number;
  declare permission: string;
}

export function GroupPermissionsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GroupPermissions.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    permission: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "ParticipantGroups_permissions",
    timestamps: false,
    freezeTableName: true,
  });

  return GroupPermissions;
};
