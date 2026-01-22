/**
 * @fileoverview Database views aggregation for SIMVA API.
 * Centralizes all database view query definitions for easy access.
 * 
 * This module:
 * - Imports view queries from different domains (users, simlets, sessions)
 * - Provides a single entry point for all database views
 * - Organizes views by functional area
 * - Supports the query documentation generation system
 * 
 * Views provide read-only access to complex data aggregations that would
 * require multiple table joins when accessed directly.
 * 
 * @module views/index
 * @requires ./userView.queries
 * @requires ./v_complete_simlets.queries  
 * @requires ./v_complete_sessions.queries
 */

import User from "./userView.queries";
import Simlet from "./v_complete_simlets.queries";
import Session from "./v_complete_sessions.queries";

/**
 * Main views object containing all database view query definitions.
 * Organized by functional domain for easy access and maintenance.
 * 
 * @type {Object}
 * @property {Object} User - User-related view queries
 * @property {Object} Simlet - SIMLET-related view queries  
 * @property {Object} Session - Session-related view queries
 * 
 * @example
 * ```typescript
 * import views from '@/lib/views';
 * 
 * // Access simlet views
 * const simletQuery = views.Simlet.byId;
 * 
 * // Access user views
 * const userQuery = views.User.byRole;
 * ```
 */
const views = {
  User,
  Simlet,
  Session,
};

export default views;
