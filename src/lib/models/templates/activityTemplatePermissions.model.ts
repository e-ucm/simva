/**
 * @fileoverview ActivityTemplatePermissions model for SIMVA API.
 * Represents permissions assigned to users for specific activity templates.
 * 
 * @module models/templates/activityTemplatePermissions
 */

import { Sequelize, Model } from "sequelize";

/**
 * ActivityTemplatePermissions model representing user permissions for activity templates.
 * Manages access control for template creation, editing, and sharing.
 * 
 * @class ActivityTemplatePermissions
 * @extends Model
 * 
 * @property {number} activity_template_id - Foreign key to the activity template (composite primary key)
 * @property {number} user_id - Foreign key to the user (composite primary key)
 * @property {"READ"|"WRITE"} permission - Permission level (READ for view access, WRITE for edit access)
 */
export class ActivityTemplatePermissions extends Model {
  declare activity_template_id: number;
  declare user_id: number;
  declare permission: "READ" | "WRITE";
}

/**
 * Factory function to initialize the ActivityTemplatePermissions model with Sequelize.
 * Creates the permissions mapping table for activity template access control.
 * 
 * @function ActivityTemplatePermissionsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ActivityTemplatePermissions} The initialized ActivityTemplatePermissions model
 * 
 * @example
 * ```typescript
 * const ActivityTemplatePermissions = ActivityTemplatePermissionsFactory(sequelize, DataTypes);
 * await ActivityTemplatePermissions.create({
 *   activity_template_id: 1,
 *   user_id: 123,
 *   permission: 'READ'
 * });
 * ```
 */

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
        isIn: [["READ", "WRITE"]],
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