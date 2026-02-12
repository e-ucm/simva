/**
 * @fileoverview Service for Activity Type management and registration.
 * Provides metadata about available activity types and their configurations.
 * 
 * Activity types define the different kinds of learning activities available in SIMVA:
 * - GameplayActivity: Interactive games and simulations
 * - LimesurveyActivity: Survey and questionnaire activities
 * - ManualActivity: Custom activities defined by instructors
 * 
 * @module services/activities/activitiesTypes
 * @requires @/lib/mappers/activities/Activity
 * @requires @/lib/mappers/activities/GameplayActivity
 * @requires @/lib/mappers/activities/LimesurveyActivity
 * @requires @/lib/mappers/activities/ManualActivity
 */

import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";

/**
 * Represents metadata about an activity type.
 * Contains type identification, display information, and utility functions.
 * 
 * @class ActivityType
 * @property {string | undefined} type - Unique identifier for the activity type
 * @property {string | undefined} name - Human-readable name for display
 * @property {string | undefined} description - Description of the activity type
 * @property {any} utils - Type-specific utility functions and configuration
 */
class ActivityType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

let activitytypes : ActivityType[] = [];

/**
 * Retrieves all available activity types with their metadata and utilities.
 * Each activity type provides type-specific configuration and utility functions
 * that are customized for the requesting user.
 * 
 * @async
 * @function getActivityTypes
 * @param {string} user - Username or identifier for user-specific configurations
 * @returns {Promise<ActivityType[]>} Array of activity type objects with metadata
 * 
 * @throws {Error} If activity type utilities cannot be loaded
 * 
 * @example
 * ```typescript
 * const types = await getActivityTypes('teacher123');
 * types.forEach(type => {
 *   console.log(`${type.name}: ${type.description}`);
 *   // Access type-specific utilities
 *   console.log(type.utils);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Example response structure:
 * [
 *   {
 *     type: "gameplay",
 *     name: "Gameplay Activity",
 *     description: "Interactive games and simulations",
 *     utils: { ... }
 *   },
 *   {
 *     type: "limesurvey", 
 *     name: "LimeSurvey Activity",
 *     description: "Survey and questionnaire activities",
 *     utils: { ... }
 *   },
 *   {
 *     type: "manual",
 *     name: "Manual Activity", 
 *     description: "Custom activities defined by instructors",
 *     utils: { ... }
 *   }
 * ]
 * ```
 */
export async function getActivityTypes(user : string) : Promise<ActivityType[]> {
	let types = [ GamePlayActivity, LimesurveyActivity, ManualActivity ];
	let activitytypes : ActivityType[] = [];

	for (let i = 0; i < types.length; i++) {
		let activitytype : ActivityType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils(user)	
		};
		activitytypes.push(activitytype);
	}
	return activitytypes;
}
