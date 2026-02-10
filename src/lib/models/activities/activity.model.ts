/**
 * @fileoverview Activity model for SIMVA API.
 * Represents learning activities within sessions that can be of various types.
 * 
 * @module models/activities/activity
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Activity model representing learning activities in SIMVA sessions.
 * Activities are the core learning components that users interact with.
 * 
 * @class Activity
 * @extends Model
 * 
 * @property {number} session_id - Foreign key to the session containing this activity
 * @property {number} activity_id - Primary key identifier for the activity
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} name - Display name of the activity
 * @property {string} activity_type - Type of activity (default, manual, limesurvey, gameplay, lti_tool)
 * @property {string|null} presignedUrl - Pre-signed URL for activity resources
 * @property {Date|null} generated_at - Timestamp when the activity was generated
 * @property {number|null} expire_on_seconds - Expiration time in seconds
 * @property {boolean} trace_storage - Whether to store user interaction traces
 * @property {string} description - Detailed description of the activity
 * @property {Date} createdAt - Timestamp when the activity was created
 * @property {Date} updatedAt - Timestamp when the activity was last updated
 */
export class Activity extends Model {
  declare session_id: number;
  declare activity_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare presignedUrl: string | null;
  declare generated_at: Date | null;
  declare expire_on_seconds: number | null;
  declare trace_storage: boolean;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Retrieve all activities from the database.
   * 
   * @async
   * @function getAllActivities
   * @param {number} [limit] - Maximum number of activities to return
   * @param {number} [offset] - Number of activities to skip for pagination
   * @returns {Promise<Activity[]>} Array of activities
   * 
   * @example
   * ```typescript
   * const activities = await Activity.getAllActivities();
   * const paginatedActivities = await Activity.getAllActivities(10, 20);
   * ```
   */
  static async getAllActivities(
    limit?: number,
    offset?: number
  ): Promise<Activity[]> {
    return await Activity.findAll({
      order: [['activity_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve an activity by its ID.
   * 
   * @async
   * @function getActivityById
   * @param {number} activity_id - The activity's ID
   * @returns {Promise<Activity>} The activity object
   * @throws {NotFoundError} If activity with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const activity = await Activity.getActivityById(123);
   * ```
   */
  static async getActivityById(activity_id: number): Promise<Activity> {
    const activity = await Activity.findByPk(activity_id);
    
    if (!activity) {
      throw new NotFoundError(`Activity with ID ${activity_id} not found`);
    }
    
    return activity;
  }

  /**
   * Retrieve activities by session ID.
   * 
   * @async
   * @function getActivitiesBySessionId
   * @param {number} session_id - The session's ID
   * @returns {Promise<Activity[]>} Array of activities in the session
   * 
   * @example
   * ```typescript
   * const activities = await Activity.getActivitiesBySessionId(123);
   * ```
   */
  static async getActivitiesBySessionId(session_id: number): Promise<Activity[]> {
    return await Activity.findAll({
      where: { session_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Retrieve activities by type.
   * 
   * @async
   * @function getActivitiesByType
   * @param {string} activity_type - The activity type
   * @returns {Promise<Activity[]>} Array of activities of the specified type
   * 
   * @example
   * ```typescript
   * const gameplayActivities = await Activity.getActivitiesByType('gameplay');
   * ```
   */
  static async getActivitiesByType(activity_type: string): Promise<Activity[]> {
    return await Activity.findAll({
      where: { activity_type },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search activities by name.
   * 
   * @async
   * @function searchActivitiesByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<Activity[]>} Array of activities matching the name pattern
   * 
   * @example
   * ```typescript
   * const activities = await Activity.searchActivitiesByName('quiz');
   * ```
   */
  static async searchActivitiesByName(name: string): Promise<Activity[]> {
    return await Activity.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get activities with trace storage enabled.
   * 
   * @async
   * @function getActivitiesWithTracing
   * @returns {Promise<Activity[]>} Array of activities with trace storage enabled
   * 
   * @example
   * ```typescript
   * const tracedActivities = await Activity.getActivitiesWithTracing();
   * ```
   */
  static async getActivitiesWithTracing(): Promise<Activity[]> {
    return await Activity.findAll({
      where: { trace_storage: true },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get activities created after a specific date.
   * 
   * @async
   * @function getActivitiesCreatedAfter
   * @param {Date} date - The date to compare against
   * @returns {Promise<Activity[]>} Array of activities created after the date
   * 
   * @example
   * ```typescript
   * const recentActivities = await Activity.getActivitiesCreatedAfter(new Date('2023-01-01'));
   * ```
   */
  static async getActivitiesCreatedAfter(date: Date): Promise<Activity[]> {
    return await Activity.findAll({
      where: {
        createdAt: {
          [Op.gt]: date
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Create a new activity.
   * 
   * @async
   * @function createActivity
   * @param {Partial<Activity>} activityData - The activity data for creation
   * @returns {Promise<Activity>} The created activity
   * 
   * @example
   * ```typescript
   * const newActivity = await Activity.createActivity({
   *   session_id: 1,
   *   name: 'Mathematics Quiz',
   *   activity_type: 'limesurvey',
   *   description: 'A quiz about basic mathematics',
   *   trace_storage: true
   * });
   * ```
   */
  static async createActivity(activityData: Partial<Activity>): Promise<Activity> {
    return await Activity.create(activityData);
  }

  /**
   * Update an existing activity by ID.
   * 
   * @async
   * @function updateActivity
   * @param {number} activity_id - The activity's ID
   * @param {Partial<Activity>} updateData - The data to update
   * @returns {Promise<Activity>} The updated activity
   * @throws {NotFoundError} If activity with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedActivity = await Activity.updateActivity(123, {
   *   name: 'Updated Activity Name',
   *   trace_storage: false
   * });
   * ```
   */
  static async updateActivity(
    activity_id: number,
    updateData: Partial<Activity>
  ): Promise<Activity> {
    const activity = await this.getActivityById(activity_id);
    
    await activity.update(updateData);
    await activity.reload();
    
    return activity;
  }

  /**
   * Delete an activity by ID.
   * 
   * @async
   * @function deleteActivity
   * @param {number} activity_id - The activity's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If activity with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await Activity.deleteActivity(123);
   * ```
   */
  static async deleteActivity(activity_id: number): Promise<void> {
    const activity = await this.getActivityById(activity_id);
    await activity.destroy();
  }

  /**
   * Count total number of activities.
   * 
   * @async
   * @function countActivities
   * @returns {Promise<number>} Total count of activities
   * 
   * @example
   * ```typescript
   * const count = await Activity.countActivities();
   * ```
   */
  static async countActivities(): Promise<number> {
    return await Activity.count();
  }

  /**
   * Count activities by session.
   * 
   * @async
   * @function countActivitiesBySession
   * @param {number} session_id - The session's ID
   * @returns {Promise<number>} Count of activities in the session
   * 
   * @example
   * ```typescript
   * const count = await Activity.countActivitiesBySession(123);
   * ```
   */
  static async countActivitiesBySession(session_id: number): Promise<number> {
    return await Activity.count({ where: { session_id } });
  }

  /**
   * Count activities by type.
   * 
   * @async
   * @function countActivitiesByType
   * @param {string} activity_type - The activity type
   * @returns {Promise<number>} Count of activities of the specified type
   * 
   * @example
   * ```typescript
   * const gameplayCount = await Activity.countActivitiesByType('gameplay');
   * ```
   */
  static async countActivitiesByType(activity_type: string): Promise<number> {
    return await Activity.count({ where: { activity_type } });
  }

  /**
   * Check if an activity exists by ID.
   * 
   * @async
   * @function activityExists
   * @param {number} activity_id - The activity's ID
   * @returns {Promise<boolean>} True if activity exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await Activity.activityExists(123);
   * ```
   */
  static async activityExists(activity_id: number): Promise<boolean> {
    const count = await Activity.count({ where: { activity_id } });
    return count > 0;
  }

  /**
   * Get distinct activity types.
   * 
   * @async
   * @function getDistinctActivityTypes
   * @returns {Promise<string[]>} Array of distinct activity types
   * 
   * @example
   * ```typescript
   * const types = await Activity.getDistinctActivityTypes();
   * ```
   */
  static async getDistinctActivityTypes(): Promise<string[]> {
    const results = await Activity.findAll({
      attributes: ['activity_type'],
      group: ['activity_type']
    });
    return results.map(a => a.activity_type);
  }
}

/**
 * Factory function to initialize the Activity model with Sequelize.
 * Defines the database schema, constraints, and relationships for activities.
 * 
 * @function ActivityFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Activity} The initialized Activity model
 * 
 * @example
 * ```typescript
 * const Activity = ActivityFactory(sequelize, DataTypes);
 * const activity = await Activity.create({
 *   session_id: 1,
 *   name: 'Quiz 1',
 *   activity_type: 'manual',
 *   description: 'Introduction quiz'
 * });
 * ```
 */
export function ActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Activity.init({
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
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
    presignedUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expire_on_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trace_storage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "Activities",
    timestamps: true,
    freezeTableName: true,
  });

  return Activity;
};