import { db } from "@/lib/db";

/**
 * Service for handling database view operations in SIMVA.
 * Provides methods to execute view queries for different data aggregations.
 * 
 * This service is separate from table services to clearly separate
 * view queries (read-only complex data aggregations) from table operations
 * (CRUD operations on individual tables).
 */

/**
 * Interface for complete simlet data from views
 */
export interface CompleteSimlet {
  simlet_id: number;
  name: string;
  description?: string;
  username?: string;
  [key: string]: any;
}

/**
 * Interface for complete session data from views
 */
export interface CompleteSession {
  session_id: number;
  simlet_id: number;
  username?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Interface for user permission data from views
 */
export interface UserPermission {
  user_id: number;
  username: string;
  object_id: number;
  object_type: string;
  permission: string;
  [key: string]: any;
}

/**
 * Retrieves a simlet by its ID.
 * Uses the v_complete_simlets view to get aggregated data.
 * 
 * @async
 * @function getSimletById
 * @param {number} simlet_id - The simlet identifier
 * @returns {Promise<CompleteSimlet[]>} Array with simlet record
 * 
 * @example
 * ```typescript
 * const simlet = await getSimletById(123);
 * ```
 */
export async function getSimletViewById(simlet_id: number): Promise<CompleteSimlet[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Simlet.byId,
    { simlet_id }
  );
  return results as CompleteSimlet[];
}

/**
 * Retrieves all simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletsByUsername
 * @param {string} username - The username to search for
 * @returns {Promise<CompleteSimlet[]>} Array of simlet records with permission information
 * 
 * @example
 * ```typescript
 * const userSimlets = await getSimletsByUsername('john_doe');
 * ```
 */
export async function getSimletsByUsername(username: string): Promise<CompleteSimlet[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Simlet.byUsername,
    { username }
  );
  return results as CompleteSimlet[];
}

/**
 * Retrieves direct user permissions for a simlet.
 * Uses the v_direct_permissions_users view to get permission data.
 * 
 * @async
 * @function getSimletUserPermissions
 * @param {number} simlet_id - The simlet identifier
 * @returns {Promise<UserPermission[]>} Array of user permission records
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletUserPermissions(123);
 * ```
 */
export async function getSimletUserPermissions(simlet_id: number): Promise<UserPermission[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Simlet.DirectUserPermissionbyId,
    { simlet_id }
  );
  return results as UserPermission[];
}

/**
 * Retrieves a session by its ID.
 * Uses the v_complete_simlets_sessions view to get aggregated data.
 * 
 * @async
 * @function getSessionById
 * @param {number} session_id - The session identifier
 * @returns {Promise<CompleteSession[]>} Array with session record
 * 
 * @example
 * ```typescript
 * const session = await getSessionById(456);
 * ```
 */
export async function getSessionById(session_id: number): Promise<CompleteSession[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Session.byId,
    { session_id }
  );
  return results as CompleteSession[];
}

/**
 * Retrieves sessions by simlet ID and username.
 * Uses the v_complete_sessions_users_permissions view to get session data with user permissions.
 * Note: This function uses simlet_id as the parameter based on the actual view definition.
 * 
 * @async
 * @function getSessionBySimletIdAndUsername
 * @param {number} simlet_id - The simlet identifier
 * @param {string} username - The username
 * @returns {Promise<CompleteSession[]>} Array of session records with permission information
 * 
 * @example
 * ```typescript
 * const sessions = await getSessionBySimletIdAndUsername(123, 'john_doe');
 * ```
 */
export async function getSessionBySimletIdAndUsername(simlet_id: number, username: string): Promise<CompleteSession[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Session.byIdAndUsername,
    { simlet_id, username }
  );
  return results as CompleteSession[];
}

/**
 * Retrieves direct user permissions for a session.
 * Uses the v_direct_permissions_users view to get permission data.
 * 
 * @async
 * @function getSessionUserPermissions
 * @param {number} session_id - The session identifier
 * @returns {Promise<UserPermission[]>} Array of user permission records
 * 
 * @example
 * ```typescript
 * const permissions = await getSessionUserPermissions(456);
 * ```
 */
export async function getSessionUserPermissions(session_id: number): Promise<UserPermission[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Session.UserPermissionbyId,
    { session_id }
  );
  return results as UserPermission[];
}