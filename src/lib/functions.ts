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
 * @requires @/lib/validateParams
 * @requires sequelize
 */

import { validateParams, Schema } from "@/lib/validateParams";
import { Sequelize, QueryTypes } from "sequelize";
import fs from "fs";
import { logger } from "@/lib/logger";

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
    runViewQuery: async (query: QueryTemplate, params: Record<string, any> = {}) : Promise<any[]> => {
      if (!query.sql || !query.params) {
        throw new Error("Invalid query template");
      }

      validateParams(query.params, params);

      return sequelize.query(query.sql, {
        replacements: params,
        type: QueryTypes.SELECT,
      });
    },

    /**
     * Converts string representations of arrays to typed arrays in an object.
     * Processes specified fields that may contain JSON array strings, comma-separated strings, or arrays.
     * 
     * @method parseStringArraysToTypedArrays
     * @param {any} obj - Object containing fields to process
     * @param {string[]} arrayFields - Array of field names to convert
     * @param {'string' | 'number' | 'boolean'} targetType - Target type for array elements
     * @returns {any} Object with converted array fields
     * 
     * @example
     * ```typescript
     * const obj = { 
     *   sessions: "[1,2,3]", 
     *   names: "john,jane,bob", 
     *   flags: "[true,false,true]" 
     * };
     * const result1 = parseStringArraysToTypedArrays(obj, ['sessions'], 'number');
     * const result2 = parseStringArraysToTypedArrays(obj, ['names'], 'string');
     * const result3 = parseStringArraysToTypedArrays(obj, ['flags'], 'boolean');
     * // Results: 
     * // { sessions: [1, 2, 3] }
     * // { names: ["john", "jane", "bob"] }
     * // { flags: [true, false, true] }
     * ```
     */
    parseStringArraysToTypedArrays: (obj: any, arrayFields: string[], targetType: 'string' | 'number' | 'boolean' = 'string') : any => {
      const processed = { ...obj };
      
      const convertValue = (value: any): any => {
        switch (targetType) {
          case 'number':
            const num = parseInt(value, 10);
            return isNaN(num) ? null : num;
          case 'boolean':
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
              const lower = value.toLowerCase();
              if (lower === 'true' || lower === '1') return true;
              if (lower === 'false' || lower === '0') return false;
            }
            return null;
          case 'string':
          default:
            return value != null ? String(value).trim() : null;
        }
      };
      
      arrayFields.forEach(field => {
        if (processed[field]) {
          if (typeof processed[field] === 'string') {
            try {
              // Try to parse as JSON array string first (e.g., "[1,2,3]")
              if (processed[field].startsWith('[') && processed[field].endsWith(']')) {
                const parsedArray = JSON.parse(processed[field]);
                if (Array.isArray(parsedArray)) {
                  processed[field] = parsedArray
                    .map(convertValue)
                    .filter((item: any) => item !== null);
                  return;
                }
              }
              
              // Fall back to comma-separated string parsing
              processed[field] = processed[field].split(',')
                .map((item: string) => convertValue(item))
                .filter((item: any) => item !== null);
            } catch (error) {
              // If JSON parsing fails, try comma-separated parsing
              processed[field] = processed[field].split(',')
                .map((item: string) => convertValue(item))
                .filter((item: any) => item !== null);
            }
          } else if (Array.isArray(processed[field])) {
            // Ensure all array items are of target type
            processed[field] = processed[field]
              .map(convertValue)
              .filter((item: any) => item !== null);
          }
        }
      });
      
      return processed;
    },

    /**
     * Executes an SQL file containing multiple SQL statements.
     * Splits file by semicolons and executes each statement sequentially.
     * 
     * @async
     * @param {string} filePath - Path to SQL file
     * @returns {Promise<void>}
     * @throws {Error} If file read or query execution fails
     */
    runSqlFile : async(filePath: string): Promise<void> => {
      const sql = fs.readFileSync(filePath, "utf8");
      const statements = sql
        .split(/;\s*$/m)
        .map((s: string) => s.trim())
        .filter(Boolean);

      for (const stmt of statements) {
        logger.debug('EXECUTING:' + stmt);
        await sequelize.query(stmt);
      }
    },
  };
};
