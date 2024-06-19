const pino = require('pino');
const config = require('./config.js');
const path = require('path');
const logsFolder = path.join(__dirname, '../logs');
var now = new Date();
const logFile = `${logsFolder.pathname}/${now.toISOString()}.log`;

/** @type {{targets:import('pino').TransportTargetOptions[]}} */
let transport = {
    targets: [
        {
            target: 'pino/file',
            level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
            options: {
                destination: logFile,
                mkdir: true
            }
        }
    ]
};
if (process.env.NODE_ENV !== 'production') {
    transport.targets.push(
            {
                target: 'pino-pretty',
                level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
                options: {
                    ignore: 'pid,hostname'
                }
            }
    );
} else {
    transport.targets.push(
        {
            target: 'pino/file',
            level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
            options: {
                singleLine: true,
                ignore: 'pid,hostname'
            }
        }
);   
}

/** @type {import('pino').LoggerOptions} */
const options = {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    redact: {
        paths: ['password', 'api.adminPassword', 'JWT.secret', 'limesurvey.adminPassword', 'sso.clientSecret', 'sso.adminPassword', 'a2.adminPassword', 'LTI.platform.mongo.password', 'LTI.platform.key'],
        censor: '**REDACTED**'
    },
    customLevels: { log: 30 },
    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
    },
    transport
}


const logger = pino.pino(options);


process.on('uncaughtException', err => {
    logger.fatal(err, 'uncaughtException')
    process.exitCode = 1
});

process.on('unhandledRejection', reason =>
    logger.fatal(reason, 'unhandledRejection')
);

module.exports = logger;