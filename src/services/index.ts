/**
 * Services Index
 * Central export point for all service modules in the Simva API.
 * This allows for clean imports throughout the application.
 */

// User Services
export * from "@/services/users/user.auth.service";

// Group Services
export * from "@/services/groups/group.service";

// Simlet Services
export * from "@/services/simlets/simlet.service";

// Activity Services
//export * from "@/services/activities/activity.service";
//export * from "@/services/activities/gameplayActivity.service";
//export * from "@/services/activities/limesurveyActivity.service";
//export * from "@/services/activities/manualActivity.service";

/**
 * @example
 * Usage examples:
 * 
 * ```typescript
 * // Import specific services
 * import { getAllUsers, createUser } from "@/services";
 * import { getAllGroups, createGroup } from "@/services";
 * 
 * // Or import all from specific service
 * import * as UserService from "@/services/users/user.service";
 * import * as GroupService from "@/services/groups/group.service";
 * ```
 */