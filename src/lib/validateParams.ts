/**
 * @fileoverview Parameter validation utilities for SIMVA API.
 * Provides type-safe parameter validation for database queries and API endpoints.
 * 
 * This module defines:
 * - Parameter type definitions and validation rules
 * - Schema-based validation for query parameters
 * - Type coercion and default value handling
 * - Comprehensive error reporting for invalid parameters
 * 
 * @module validateParams
 */

/**
 * Supported parameter types for validation.
 * @typedef {string} ParamType
 */
export type ParamType = "string" | "number" | "boolean" | "array";

/**
 * Validation rule definition for a single parameter.
 * 
 * @interface ParamRule
 * @property {ParamType} type - The expected data type of the parameter
 * @property {boolean} [required=false] - Whether this parameter is required
 * @property {any} [default] - Default value to use if parameter is undefined
 * @property {"string"|"number"|"boolean"} [of] - Type of array elements (when type is "array")
 * @property {string} [description] - Human-readable description of the parameter
 * @property {any} [example] - Example value for documentation
 * 
 * @example
 * ```typescript
 * const userIdRule: ParamRule = {
 *   type: "number",
 *   required: true,
 *   description: "User identifier",
 *   example: 123
 * };
 * ```
 */
export interface ParamRule {
  type: ParamType;
  required?: boolean;
  default?: any;
  of?: "string" | "number" | "boolean";
  description?: string;
  example?: any;
}

/**
 * Schema definition for validating a collection of parameters.
 * Maps parameter names to their validation rules.
 * 
 * @typedef {Record<string, ParamRule>} ParamSchema
 * 
 * @example
 * ```typescript
 * const querySchema: ParamSchema = {
 *   userId: {
 *     type: "number",
 *     required: true,
 *     description: "User identifier"
 *   },
 *   limit: {
 *     type: "number",
 *     default: 10,
 *     description: "Maximum results to return"
 *   }
 * };
 * ```
 */
export type ParamSchema = Record<string, ParamRule>;

/**
 * Validates parameters against a schema definition.
 * Performs type checking, required field validation, and applies default values.
 * Modifies the params object in-place by adding default values where applicable.
 * 
 * @function validateParams
 * @param {ParamSchema} schema - The validation schema defining expected parameters
 * @param {Record<string, any>} params - The parameters object to validate (modified in-place)
 * @throws {Error} When required parameters are missing or type validation fails
 * 
 * @example
 * ```typescript
 * const schema = {
 *   id: { type: "number", required: true },
 *   name: { type: "string", default: "Anonymous" },
 *   tags: { type: "array", of: "string" }
 * };
 * 
 * const params = { id: 123, tags: ["tag1", "tag2"] };
 * validateParams(schema, params);
 * // params.name is now "Anonymous"
 * ```
 */
export default function validateParams(schema: ParamSchema, params: Record<string, any>): void {
  for (const [key, rules] of Object.entries(schema)) {
    let value = params[key];

    if (value === undefined) {
      if (rules.required) {
        throw new Error(`Missing required parameter: ${key}`);
      }
      if ("default" in rules) {
        params[key] = rules.default;
      }
      continue;
    }

    switch (rules.type) {
      case "string":
        if (typeof value !== "string") {
          throw new Error(`${key} must be a string`);
        }
        break;

      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) {
          throw new Error(`${key} must be a number`);
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          throw new Error(`${key} must be a boolean`);
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          throw new Error(`${key} must be an array`);
        }
        if (rules.of) {
          for (const v of value) {
            if (typeof v !== rules.of) {
              throw new Error(`${key} array values must be ${rules.of}`);
            }
          }
        }
        break;

      default:
        throw new Error(`Unknown type: ${String((rules as any).type)}`);
    }
  }
}
