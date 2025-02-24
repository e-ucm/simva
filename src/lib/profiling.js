const config = require('./config.js');
const path = require('path');
const logger = require("./logger.js");
const ms = require('ms');

if(process.env.NODE_ENV == "development" && config.api.profiling) {
  logger.info("Profiling in progress...");
  const profilingFolder = process.env.PROFILING_FOLDER || path.join(__dirname, '../../../profiling');
  // Schedule a task to run every x
  function profiling() {
    logger.info(`schedule task for profiling running...`);
    //let filename=`${profilingFolder}/Heap.${now().toISOString()}.heapsnapshot`;
    let filename=`${profilingFolder}/${require('v8').writeHeapSnapshot()}`;
    logger.info(`Saved heapdump into ${require('v8').writeHeapSnapshot(filename)}`);
    setTimeout(profiling, ms("30min"));
  }
  profiling();
}