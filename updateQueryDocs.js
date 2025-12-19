const fs = require("fs");
const generateDocs = require("./src/lib/sql_model/generateQueryDocs");

try {
    fs.writeFileSync("QUERY_DOCS.md", generateDocs());
    console.log(`Updated QUERY_DOCS.md.`);
  } catch (e) {
    console.error(`Error while generating DOCs:`, e);
  }