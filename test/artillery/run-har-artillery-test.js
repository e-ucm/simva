const { exec } = require('child_process');
require('dotenv').config();

// Artillery command
const harFile=process.env.HAR_FILE_PATH;
const command = `artillery run --output report.json ${__dirname}\\${harFile.replace(".har","")}-har-artillery-config.yml`;

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing Artillery: ${error.message}`);
    console.error(error.stack);
    return;
  }
  console.log(`Artillery stdout:\n${stdout}`);
  if (stderr) {
    console.error(`Artillery stderr: ${stderr}`);
    return;
  }
});