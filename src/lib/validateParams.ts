/**
 * Validation rule for a single parameter.
 * 
 * @typedef {Object} ValidationRule
 * @property {string} type - Data type (string, number, boolean, array)
 * @property {boolean} [required] - Whether the parameter is required
 * @property {string} [default] - Default value if not provided
 * @property {string} [of] - Element type for array parameters
 * @property {string} [description] - Description of the parameter
 * @property {string} [example] - Example value for the parameter
 */
export interface ValidationRule {
    type: "string" | "number" | "boolean" | "array";
    required?: boolean;
    default?: string;
    of?: string;
    description?: string;
    example?: string;
}

/**
 * Validation schema mapping parameter names to their validation rules.
 * 
 * @typedef {Object} Schema
 */
export interface Schema {
    [key: string]: ValidationRule;
}

/**
 * Object containing parameter values to validate.
 * 
 * @typedef {Object} Params
 */
interface Params {
    [key: string]: any;
}

/**
 * Validates a set of parameters against a schema.
 * Enforces type checking, required fields, and default values.
 * 
 * @function validateParams
 * @param {Schema} schema - Validation schema defining expected parameters
 * @param {Params} params - Parameters to validate (modified in place with defaults)
 * @throws {Error} If validation fails
 * 
 * @example
 * ```typescript
 * const schema = {
 *   userId: { type: 'number', required: true },
 *   limit: { type: 'number', default: '10' },
 *   tags: { type: 'array', of: 'string' }
 * };
 * 
 * validateParams(schema, { userId: 123, tags: ['a', 'b'] });
 * // Adds limit: '10' as default
 * ```
 */
export function validateParams(schema: Schema, params: Params): void {
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
                if(!rules.default) {
                    throw new Error(`${key} must be a string`);
                }
            }
            break;

        case "number":
            if (typeof value !== "number" || Number.isNaN(value)) {
                if(!rules.default) {
                    throw new Error(`${key} must be a number`);
                }
            }
            break;

        case "boolean":
            if (typeof value !== "boolean") {
                if(!rules.default) {
                    throw new Error(`${key} must be a boolean`);
                }
            }
            break;

        case "array":
            if (!Array.isArray(value)) {
                if(!rules.default) {
                    throw new Error(`${key} must be an array`);
                }
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
            throw new Error(`Unknown type: ${rules.type}`);
        }
    }
}