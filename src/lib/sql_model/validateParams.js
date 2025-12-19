module.exports = function validateParams(schema, params) {
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
            throw new Error(`Unknown type: ${rules.type}`);
        }
    }
}