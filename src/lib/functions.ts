/**
 * @fileoverview Database utility functions for SIMVA API.
 * Provides safe, parameterized query execution with validation.
 * 
 * This module provides:
 * - Template-based query execution with parameter validation
 * - SQL injection protection through parameterized queries
 * - Type-safe query parameter handling
 * - Consistent error handling for database operations
 * 
 * @module functions
 * @requires ./validateParams
 * @requires sequelize
 */

import { validateParams, Schema } from "./validateParams";
import { Sequelize, QueryTypes } from "sequelize";

/**
 * Template structure for database queries.
 * Ensures all queries have proper parameterization and documentation.
 * 
 * @interface QueryTemplate
 * @property {string} [description] - Human-readable description of the query
 * @property {string} sql - SQL query string with named parameters (e.g., :param_name)
 * @property {Schema} params - Parameter validation schema
 */
export interface QueryTemplate {
  description?: string;
  sql: string;
  params: Schema;
}

/**
 * Factory function that creates database utility functions.
 * Returns an object with methods for safe query execution.
 * 
 * @function default
 * @param {Sequelize} sequelize - Sequelize instance for database operations
 * @returns {Object} Object containing database utility functions
 * 
 * @example
 * ```typescript
 * import initFunctions from '@/lib/functions';
 * const functions = initFunctions(sequelize);
 * 
 * const results = await functions.runViewQuery(queryTemplate, { id: 123 });
 * ```
 */
export default (sequelize: Sequelize) => {
  return {
    /**
     * Execute a parameterized database query with validation.
     * Validates parameters against schema before execution to prevent SQL injection.
     * 
     * @async
     * @method runViewQuery
     * @param {QueryTemplate} query - Query template with SQL and parameter schema
     * @param {Record<string, any>} [params={}] - Query parameters to validate and substitute
     * @returns {Promise<Array>} Array of query result objects
     * @throws {Error} If query template is invalid or parameter validation fails
     * 
     * @example
     * ```typescript
     * const query = {
     *   sql: 'SELECT * FROM users WHERE id = :userId',
     *   params: {
     *     userId: { type: 'number', required: true }
     *   }
     * };
     * 
     * const results = await runViewQuery(query, { userId: 123 });
     * ```
     */
    runViewQuery: async (query: QueryTemplate, params: Record<string, any> = {}) => {
      if (!query.sql || !query.params) {
        throw new Error("Invalid query template");
      }

      validateParams(query.params, params);

      return sequelize.query(query.sql, {
        replacements: params,
        type: QueryTypes.SELECT,
      });
    },
  };
};
