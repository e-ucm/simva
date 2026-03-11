/**
 * @fileoverview Mapper class for Activity Type metadata.
 * Provides structured representation of activity types with serialization support.
 * 
 * @module lib/mappers/activities/ActivityType
 * @requires @/lib/mappers/activities/GameplayActivity
 * @requires @/lib/mappers/activities/LimesurveyActivity
 * @requires @/lib/mappers/activities/ManualActivity
 */

import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";

/**
 * ActivityType mapper class representing metadata about an activity type.
 * Contains type identification, display information, and utility functions.
 * 
 * @class ActivityType
 * @description Manages activity type metadata with serialization support for API responses.
 */
export class ActivityType {
	/**
	 * Unique identifier for the activity type
	 */
	activity_type?: string;

	/**
	 * Human-readable name for display
	 */
	activity_name?: string;

	/**
	 * Description of the activity type
	 */
	activity_description?: string;

	/**
	 * Type-specific utility functions and configuration
	 */
	activity_utils: any;

	/**
	 * Creates a new ActivityType instance from raw data.
	 * 
	 * @constructor
	 * @param {any} data - Raw data object containing activity type properties
	 * 
	 * @example
	 * ```typescript
	 * const activityType = new ActivityType({
	 *   activity_type: 'gameplay',
	 *   activity_name: 'Gameplay Activity',
	 *   activity_description: 'Interactive games and simulations',
	 *   activity_utils: { ... }
	 * });
	 * ```
	 */
	constructor(data: any) {
		this.activity_type = data.activity_type;
		this.activity_name = data.activity_name;
		this.activity_description = data.activity_description;
		this.activity_utils = data.activity_utils;
	}

	/**
	 * Converts the ActivityType instance to a plain JSON object.
	 * Returns serializable representation for API responses.
	 * 
	 * @method toJSON
	 * @returns {object} Plain object containing activity type properties
	 * 
	 * @example
	 * ```typescript
	 * const activityTypeData = activityType.toJSON();
	 * logger.info('Activity type:', activityTypeData.activity_type);
	 * ```
	 */
	toJSON(): object {
		return {
			activity_type: this.activity_type,
			activity_name: this.activity_name,
			activity_description: this.activity_description,
			activity_utils: this.activity_utils
		};
	}

	/**
	 * Retrieves all available activity types with their metadata and utilities.
	 * Each activity type provides type-specific configuration and utility functions
	 * that are customized for the requesting user.
	 * 
	 * @static
	 * @async
	 * @method getAll
	 * @param {string} user - Username or identifier for user-specific configurations
	 * @returns {Promise<ActivityType[]>} Array of ActivityType instances with metadata
	 * 
	 * @example
	 * ```typescript
	 * const types = await ActivityType.getAll('teacher123');
	 * types.forEach(type => {
	 *   logger.info(`${type.activity_name}: ${type.activity_description}`);
	 * });
	 * ```
	 */
	static async getAll(type?: string[]): Promise<ActivityType[]> {
		if(!type) {
            type = [GamePlayActivity.getType(), LimesurveyActivity.getType(), ManualActivity.getType()];
        }
        const types : any[] = [];
        if(type.includes(GamePlayActivity.getType())) types.push(GamePlayActivity);
        if(type.includes(LimesurveyActivity.getType())) types.push(LimesurveyActivity);
        if(type.includes(ManualActivity.getType())) types.push(ManualActivity);
		const activityTypes: ActivityType[] = [];

		for (let i = 0; i < types.length; i++) {
			const activityType = new ActivityType({
				activity_type: types[i].getType(),
				activity_name: types[i].getName(),
				activity_description: types[i].getDescription(),
				activity_utils: await types[i].getUtils()
			});
			activityTypes.push(activityType);
		}
		return activityTypes;
	}
}
