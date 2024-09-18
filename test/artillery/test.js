require('dotenv').config();
const { exec } = require('child_process');

// Artillery command
const command = `artillery run --output report.json ${__dirname}\\simulation.yml`;

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