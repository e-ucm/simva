/**
 * @fileoverview GroupPermissions model for SIMVA API.
 * Represents permissions assigned to users within specific groups.
 * 
 * @module models/groups/groupPermissions
 */

import { Sequelize, Model } from "sequelize";

/**
 * GroupPermissions model representing user permissions within groups.
 * Manages fine-grained access control for group-specific actions.
 * 
 * @class GroupPermissions
 * @extends Model
 * 
 * @property {number} group_id - Foreign key to the group (composite primary key)
 * @property {number} user_id - Foreign key to the user (composite primary key)
 * @property {string} permission - Permission name/type (composite primary key)
 */
export class GroupPermissions extends Model {
  declare group_id: number;
  declare user_id: number;
  declare permission: string;
}

/**
 * Factory function to initialize the GroupPermissions model with Sequelize.
 * Creates the permissions mapping table for group-based access control.
 * 
 * @function GroupPermissionsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof GroupPermissions} The initialized GroupPermissions model
 * 
 * @example
 * ```typescript
 * const GroupPermissions = GroupPermissionsFactory(sequelize, DataTypes);
 * await GroupPermissions.create({
 *   group_id: 1,
 *   user_id: 123,
 *   permission: 'edit'
 * });
 * ```
 */

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
