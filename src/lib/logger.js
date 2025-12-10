const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logsFolder = process.env.LOG_FOLDER || path.join(__dirname, '../../logs');

// Ensure logs folder exists
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder, { recursive: true });
}

// Safe timestamp for filename (no colons)
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(logsFolder, `${timestamp}.log`);

// Base logger options
const options = {
  level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  redact: {
    paths: [
      'config.password',
      'config.api.adminPassword',
      'config.JWT.secret',
      'config.limesurvey.adminPassword',
      'config.sso.clientSecret',
      'config.sso.adminPassword',
      'config.a2.adminPassword',
      'config.LTI.platform.mongo.password',
      'config.LTI.platform.key'
    ],
    censor: '**REDACTED**'
  },
  customLevels: { log: 30 },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

// Transport configuration
let transportTargets = [];
transportTargets.push({
  target: 'pino-pretty',
  level: options.level,
  options: { colorize: true, ignore: 'pid,hostname' }
});

//if (process.env.NODE_ENV !== 'production') {
//// Development: console pretty
//  transportTargets.push({
//    target: 'pino-pretty',
//    level: options.level,
//    options: { colorize: true, ignore: 'pid,hostname' }
//  });
//} else {
//    // Production: optional file logging
//    transportTargets.push({
//    target: 'pino/file',
//    level: options.level,
//    options: {
//        destination: logFile,
//        mkdir: true,
//        singleLine: true,
//        ignore: 'pid,hostname'
//    }
//    });
//}

options.transport = { targets: transportTargets };

// Create logger
const logger = pino(options);

// Global exception handlers (safe fallback)
process.on('uncaughtException', err => {
  try {
    logger.fatal(err, 'uncaughtException');
  } catch {
    console.error('uncaughtException', err);
  }
  process.exitCode = 1;
});

process.on('unhandledRejection', reason => {
  try {
    logger.fatal(reason, 'unhandledRejection');
  } catch {
    console.error('unhandledRejection', reason);
  }
});

module.exports = logger;
