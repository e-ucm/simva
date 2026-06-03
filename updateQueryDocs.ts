/**
 * @fileoverview Generates QUERY_DOCS.md documentation from database query definitions.
 * Utility script that creates comprehensive documentation for all database queries and views.
 * 
 * This script provides:
 * - Automated documentation generation for database queries
 * - Markdown formatted output for easy reading
 * - Error handling for file operations and documentation generation
 * 
 * @module updateQueryDocs
 * @requires fs
 * @requires @/lib/generateQueryDocs
 * 
 * @example
 * ```bash
 * npm run update-query-docs
 * # or
 * npx ts-node updateQueryDocs.ts
 * ```
 */

import fs from "fs";
import generateDocs from "@/lib/generateQueryDocs";

/**
 * Main execution block for query documentation generation.
 * Generates documentation from database queries and writes to QUERY_DOCS.md.
 * 
 * @function
 * @returns {void}
 * @throws {Error} When documentation generation or file writing fails
 */
try {
  fs.writeFileSync("QUERY_DOCS.md", generateDocs());
  console.log(`Updated QUERY_DOCS.md.`);
} catch (e) {
  console.error(`Error while generating DOCs:`, e);
}
