const config = require('./config.js');
const path = require('path');
const { now, convertTimeToCron } = require("./utils/date.js");
const logger = require("./logger.js");
const cron = require('node-cron');

if(process.env.NODE_ENV == "development") {
  logger.info("Profiling in progress...");
  const profilingFolder = process.env.PROFILING_FOLDER || path.join(__dirname, '../../../profiling');
  // Schedule a task to run every x
  let intervalInMin=30;
  const cronTime = convertTimeToCron(intervalInMin);
  logger.info(cronTime);
  cron.schedule(cronTime, async () => {
    logger.info(`schedule task for profiling running...`);
    //let filename=`${profilingFolder}/Heap.${now().toISOString()}.heapsnapshot`;
    let filename=`${profilingFolder}/${require('v8').writeHeapSnapshot()}`;
    logger.info(`Saved heapdump into ${require('v8').writeHeapSnapshot(filename)}`);
  });
}

/*
import {
  Worker,
  isMainThread,
  parentPort,
} from 'node:worker_threads';

if (isMainThread) {
  const worker = new Worker(__filename);

  worker.once('message', (filename) => {
    logger.info(`worker heapdump: ${filename}`);
    // Now get a heapdump for the main thread.
    logger.info(`main thread heapdump: ${v8.writeHeapSnapshot(`${profilingFolder}/Heap.${now().toISOString()}.heapsnapshot`)}`);
  });

  // Tell the worker to create a heapdump.
  worker.postMessage('heapdump');
} else {
  parentPort.once('message', (message) => {
    if (message === 'heapdump') {
      // Generate a heapdump for the worker
      // and return the filename to the parent.
      parentPort.postMessage(v8.writeHeapSnapshot(`${profilingFolder}/Heap.${now().toISOString()}.heapsnapshot`));
    }
  });
}
*/