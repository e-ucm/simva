/**
 * @fileoverview Converts OpenAPI YAML specification to JSON format.
 * Utility script that reads api.yaml and generates openapi.json for API documentation.
 * 
 * This script provides:
 * - YAML to JSON conversion for OpenAPI specifications
 * - Error handling for file operations and YAML parsing
 * - Automated JSON formatting with proper indentation
 * 
 * @module updateOpenAPI
 * @requires fs
 * @requires yaml
 * 
 * @example
 * ```bash
 * npm run update-openapi
 * # or
 * npx ts-node updateOpenAPI.ts
 * ```
 */

import fs from 'fs';
import yaml from 'yaml';

/**
 * Input YAML file path containing the OpenAPI specification.
 * @constant {string}
 */
const inputFile = 'api.yaml';

/**
 * Output JSON file path for the converted OpenAPI specification.
 * @constant {string}
 */
const outputFile = 'openapi.json';

/**
 * Main execution block for YAML to JSON conversion.
 * Reads the OpenAPI YAML file and converts it to formatted JSON.
 * 
 * @async
 * @function
 * @param {NodeJS.ErrnoException | null} err - File read error
 * @param {string} data - YAML content from the input file
 * @returns {void}
 */

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading ${inputFile}:`, err);
    return;
  }

  try {
    const json = yaml.parse(data);
    fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));
    console.log(`Updated ${outputFile} from ${inputFile}`);
  } catch (parseErr) {
    console.error(`Error parsing YAML:`, parseErr);
  }
});
