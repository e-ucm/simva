const fs = require('fs');
const yaml = require('yaml');

const inputFile = 'api.yaml';
const outputFile = 'openapi.json';

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
