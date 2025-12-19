const views = require("./views/index");

function formatType(param) {
  if (param.type === "array") {
    return `array<${param.of}>`;
  }
  return param.type;
}

function generateDocs() {
  let md = "# Database View Queries\n\n";

  for (const [viewName, queries] of Object.entries(views)) {
    md += `## ${viewName}\n\n`;

    for (const [queryName, query] of Object.entries(queries)) {
      md += `### ${queryName}\n\n`;
      md += `${query.description || "No description"}\n\n`;

      md += "**SQL**\n";
      md += "```sql\n" + query.sql.trim() + "\n```\n\n";

      if (query.params && Object.keys(query.params).length > 0) {
        md += "**Parameters**\n\n";
        md += "| Name | Type | Required | Default | Description | Example |\n";
        md += "|------|------|----------|---------|-------------|---------|\n";

        for (const [name, p] of Object.entries(query.params)) {
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

module.exports = generateDocs;
