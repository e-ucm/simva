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
 * @requires @/lib/mappers/activities/ActivityType
 */

import { ActivityType } from "@/lib/mappers/activities/ActivityType";

export { ActivityType };

/**
 * Retrieves all available activity types with their metadata and utilities.
 * Each activity type provides type-specific configuration and utility functions
 * that are customized for the requesting user.
 * 
 * @async
 * @function getActivityTypes
 * @param {string[]} types - Array of activity type identifiers to retrieve
 * @returns {Promise<ActivityType[]>} Array of activity type objects with metadata
 * 
 * @throws {Error} If activity type utilities cannot be loaded
 * 
 * @example
 * ```typescript
 * const types = await getActivityTypes(['gameplay', 'limesurvey']);
 * types.forEach(type => {
 *   logger.info(`${type.activity_name}: ${type.activity_description}`);
 *   // Access type-specific utilities
 *   logger.info(type.activity_utils);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Example response structure:
 * [
 *   {
 *     activity_type: "gameplay",
 *     activity_name: "Gameplay Activity",
 *     activity_description: "Interactive games and simulations",
 *     activity_utils: { ... }
 *   },
 *   {
 *     activity_type: "limesurvey", 
 *     activity_name: "LimeSurvey Activity",
 *     activity_description: "Survey and questionnaire activities",
 *     activity_utils: { ... }
 *   },
 *   {
 *     activity_type: "manual",
 *     activity_name: "Manual Activity", 
 *     activity_description: "Custom activities defined by instructors",
 *     activity_utils: { ... }
 *   }
 * ]
 * ```
 */
export async function getActivityTypes(types?: string[]) : Promise<ActivityType[]> {
	return ActivityType.getAll(types);
}
