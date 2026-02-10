/**
 * @fileoverview ActivityTemplate model for SIMVA API.
 * Represents reusable activity templates for creating standardized learning activities.
 * 
 * @module models/templates/activityTemplate
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * ActivityTemplate model representing reusable activity templates in SIMVA.
 * Templates provide standardized configurations for creating learning activities.
 * 
 * @class ActivityTemplate
 * @extends Model
 * 
 * @property {number} activity_template_id - Primary key identifier for the template
 * @property {string} name - Display name of the activity template
 * @property {string} activity_type - Type of activity (default, manual, limesurvey, gameplay, lti_tool)
 * @property {string} description - Detailed description of the template
 * @property {boolean} public - Whether this template is publicly available
 * @property {Date} createdAt - Timestamp when the template was created
 * @property {Date} updatedAt - Timestamp when the template was last updated
 * @property {number} owner_id - Foreign key to the template owner (teacher/admin)
 */
export class ActivityTemplate extends Model {
  declare activity_template_id: number;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare description: string;
  declare public: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare owner_id: number;

  /**
   * Retrieve all activity templates from the database.
   * 
   * @async
   * @function getAllActivityTemplates
   * @param {number} [limit] - Maximum number of templates to return
   * @param {number} [offset] - Number of templates to skip for pagination
   * @returns {Promise<ActivityTemplate[]>} Array of activity templates
   * 
   * @example
   * ```typescript
   * const templates = await ActivityTemplate.getAllActivityTemplates();
   * const paginatedTemplates = await ActivityTemplate.getAllActivityTemplates(10, 20);
   * ```
   */
  static async getAllActivityTemplates(
    limit?: number,
    offset?: number
  ): Promise<ActivityTemplate[]> {
    return await ActivityTemplate.findAll({
      order: [['name', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve an activity template by its ID.
   * 
   * @async
   * @function getActivityTemplateById
   * @param {number} activity_template_id - The template's ID
   * @returns {Promise<ActivityTemplate>} The template object
   * @throws {NotFoundError} If template with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const template = await ActivityTemplate.getActivityTemplateById(123);
   * ```
   */
  static async getActivityTemplateById(activity_template_id: number): Promise<ActivityTemplate> {
    const template = await ActivityTemplate.findByPk(activity_template_id);
    
    if (!template) {
      throw new NotFoundError(`Activity template with ID ${activity_template_id} not found`);
    }
    
    return template;
  }

  /**
   * Retrieve public activity templates.
   * 
   * @async
   * @function getPublicActivityTemplates
   * @returns {Promise<ActivityTemplate[]>} Array of public templates
   * 
   * @example
   * ```typescript
   * const publicTemplates = await ActivityTemplate.getPublicActivityTemplates();
   * ```
   */
  static async getPublicActivityTemplates(): Promise<ActivityTemplate[]> {
    return await ActivityTemplate.findAll({
      where: { public: true },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Retrieve activity templates by owner.
   * 
   * @async
   * @function getActivityTemplatesByOwner
   * @param {number} owner_id - The owner's user ID
   * @returns {Promise<ActivityTemplate[]>} Array of templates owned by the user
   * 
   * @example
   * ```typescript
   * const myTemplates = await ActivityTemplate.getActivityTemplatesByOwner(123);
   * ```
   */
  static async getActivityTemplatesByOwner(owner_id: number): Promise<ActivityTemplate[]> {
    return await ActivityTemplate.findAll({
      where: { owner_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Retrieve activity templates by type.
   * 
   * @async
   * @function getActivityTemplatesByType
   * @param {string} activity_type - The activity type
   * @returns {Promise<ActivityTemplate[]>} Array of templates of the specified type
   * 
   * @example
   * ```typescript
   * const quizTemplates = await ActivityTemplate.getActivityTemplatesByType('limesurvey');
   * ```
   */
  static async getActivityTemplatesByType(activity_type: string): Promise<ActivityTemplate[]> {
    return await ActivityTemplate.findAll({
      where: { activity_type },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search activity templates by name.
   * 
   * @async
   * @function searchActivityTemplatesByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<ActivityTemplate[]>} Array of templates matching the name pattern
   * 
   * @example
   * ```typescript
   * const templates = await ActivityTemplate.searchActivityTemplatesByName('quiz');
   * ```
   */
  static async searchActivityTemplatesByName(name: string): Promise<ActivityTemplate[]> {
    return await ActivityTemplate.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Create a new activity template.
   * 
   * @async
   * @function createActivityTemplate
   * @param {Partial<ActivityTemplate>} templateData - The template data for creation
   * @returns {Promise<ActivityTemplate>} The created template
   * 
   * @example
   * ```typescript
   * const newTemplate = await ActivityTemplate.createActivityTemplate({
   *   name: 'Quiz Template',
   *   activity_type: 'limesurvey',
   *   description: 'Template for creating quizzes',
   *   public: true,
   *   owner_id: 123
   * });
   * ```
   */
  static async createActivityTemplate(templateData: Partial<ActivityTemplate>): Promise<ActivityTemplate> {
    return await ActivityTemplate.create(templateData);
  }

  /**
   * Update an existing activity template by ID.
   * 
   * @async
   * @function updateActivityTemplate
   * @param {number} activity_template_id - The template's ID
   * @param {Partial<ActivityTemplate>} updateData - The data to update
   * @returns {Promise<ActivityTemplate>} The updated template
   * @throws {NotFoundError} If template with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedTemplate = await ActivityTemplate.updateActivityTemplate(123, {
   *   name: 'Updated Template Name',
   *   public: false
   * });
   * ```
   */
  static async updateActivityTemplate(
    activity_template_id: number,
    updateData: Partial<ActivityTemplate>
  ): Promise<ActivityTemplate> {
    const template = await this.getActivityTemplateById(activity_template_id);
    
    await template.update(updateData);
    await template.reload();
    
    return template;
  }

  /**
   * Delete an activity template by ID.
   * 
   * @async
   * @function deleteActivityTemplate
   * @param {number} activity_template_id - The template's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If template with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await ActivityTemplate.deleteActivityTemplate(123);
   * ```
   */
  static async deleteActivityTemplate(activity_template_id: number): Promise<void> {
    const template = await this.getActivityTemplateById(activity_template_id);
    await template.destroy();
  }

  /**
   * Count total number of activity templates.
   * 
   * @async
   * @function countActivityTemplates
   * @returns {Promise<number>} Total count of templates
   * 
   * @example
   * ```typescript
   * const count = await ActivityTemplate.countActivityTemplates();
   * ```
   */
  static async countActivityTemplates(): Promise<number> {
    return await ActivityTemplate.count();
  }

  /**
   * Count public activity templates.
   * 
   * @async
   * @function countPublicActivityTemplates
   * @returns {Promise<number>} Count of public templates
   * 
   * @example
   * ```typescript
   * const count = await ActivityTemplate.countPublicActivityTemplates();
   * ```
   */
  static async countPublicActivityTemplates(): Promise<number> {
    return await ActivityTemplate.count({ where: { public: true } });
  }

  /**
   * Count activity templates by owner.
   * 
   * @async
   * @function countActivityTemplatesByOwner
   * @param {number} owner_id - The owner's user ID
   * @returns {Promise<number>} Count of templates owned by the user
   * 
   * @example
   * ```typescript
   * const count = await ActivityTemplate.countActivityTemplatesByOwner(123);
   * ```
   */
  static async countActivityTemplatesByOwner(owner_id: number): Promise<number> {
    return await ActivityTemplate.count({ where: { owner_id } });
  }

  /**
   * Check if an activity template exists by ID.
   * 
   * @async
   * @function activityTemplateExists
   * @param {number} activity_template_id - The template's ID
   * @returns {Promise<boolean>} True if template exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await ActivityTemplate.activityTemplateExists(123);
   * ```
   */
  static async activityTemplateExists(activity_template_id: number): Promise<boolean> {
    const count = await ActivityTemplate.count({ where: { activity_template_id } });
    return count > 0;
  }

  /**
   * Get distinct activity types from templates.
   * 
   * @async
   * @function getDistinctActivityTypes
   * @returns {Promise<string[]>} Array of distinct activity types
   * 
   * @example
   * ```typescript
   * const types = await ActivityTemplate.getDistinctActivityTypes();
   * ```
   */
  static async getDistinctActivityTypes(): Promise<string[]> {
    const results = await ActivityTemplate.findAll({
      attributes: ['activity_type'],
      group: ['activity_type']
    });
    return results.map(t => t.activity_type);
  }
}

/**
 * Factory function to initialize the ActivityTemplate model with Sequelize.
 * Defines the database schema and validation for activity templates.
 * 
 * @function ActivityTemplateFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ActivityTemplate} The initialized ActivityTemplate model
 * 
 * @example
 * ```typescript
 * const ActivityTemplate = ActivityTemplateFactory(sequelize, DataTypes);
 * const template = await ActivityTemplate.create({
 *   name: 'Quiz Template',
 *   activity_type: 'manual',
 *   description: 'Standard quiz format',
 *   public: true,
 *   owner_id: 1
 * });
 * ```
 */
export function ActivityTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "manual", "limesurvey", "gameplay", "lti_tool"]],
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    public: {
      type: DataTypes.BOOLEAN,
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
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ActivityTemplate",
    tableName: "Activities_template",
    timestamps: true,
  });

  return ActivityTemplate;
}