/**
 * @fileoverview Query documentation generator for SIMVA API.
 * Automatically generates Markdown documentation from database view query definitions.
 * 
 * This module:
 * - Parses view query definitions from the views index
 * - Generates formatted Markdown documentation
 * - Creates parameter tables with types and descriptions
 * - Formats SQL queries with syntax highlighting
 * - Provides comprehensive API documentation for database views
 * 
 * @module generateQueryDocs
 * @requires @/lib/views/index
 */

import views from "@/lib/views/index";

/**
 * Formats parameter types for documentation display.
 * Handles array types with element type specification.
 * 
 * @function formatType
 * @param {Object} param - Parameter definition object
 * @param {string} param.type - The parameter type (string, number, boolean, array)
 * @param {string} [param.of] - Element type for arrays
 * @returns {string} Formatted type string for documentation
 * 
 * @example
 * ```typescript
 * formatType({ type: "array", of: "string" }); // returns "array<string>"
 * formatType({ type: "number" }); // returns "number"
 * ```
 */
function formatType(param: { type: string; of?: string }): string {
  if (param.type === "array") {
    return `array<${param.of}>`;
  }
  return param.type;
}

/**
 * Generates comprehensive Markdown documentation for all database view queries.
 * Iterates through all views and queries to create formatted documentation.
 * 
 * @function generateDocs
 * @returns {string} Complete Markdown documentation string
 * 
 * Generated documentation includes:
 * - View organization with hierarchical headers
 * - Query descriptions and purposes
 * - Formatted SQL code blocks
 * - Parameter tables with types, requirements, and examples
 * - Cross-references between related queries
 * 
 * @example
 * ```typescript
 * import generateDocs from '@/lib/generateQueryDocs';
 * 
 * const docs = generateDocs();
 * console.log(docs); // Complete Markdown documentation
 * 
 * // Write to file
 * fs.writeFileSync('QUERY_DOCS.md', docs);
 * ```
 */
function generateDocs(): string {
  let md = "# Database View Queries\n\n";

  for (const [viewName, queries] of Object.entries(views as Record<string, Record<string, any>>)) {
    md += `## ${viewName}\n\n`;

    for (const [queryName, query] of Object.entries(queries)) {
      md += `### ${queryName}\n\n`;
      md += `${query.description || "No description"}\n\n`;

      md += "**SQL**\n";
      md += "```sql\n" + String(query.sql).trim() + "\n```\n\n";

      if (query.params && Object.keys(query.params).length > 0) {
        md += "**Parameters**\n\n";
        md += "| Name | Type | Required | Default | Description | Example |\n";
        md += "|------|------|----------|---------|-------------|---------|\n";

        for (const [name, p] of Object.entries(query.params as Record<string, any>)) {
          md += `| ${name} | ${formatType(p)} | ${p.required ? "yes" : "no"} | ${
            p.default ?? "-"
          } | ${p.description ?? "-"} | ${
            p.example ? JSON.stringify(p.example) : "-"
          } |\n`;
        }

        md += "\n";
      } else {
        md += "_No parameters_\n\n";
      }
    }
  }

  return md;
}

/**
 * Default export of the documentation generator function.
 * 
 * @function default
 * @see generateDocs
 */
export default generateDocs;
