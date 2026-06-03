/**
 * @fileoverview Centralized logging configuration for SIMVA API.
 * Provides structured logging with file output, console formatting, and error handling.
 * 
 * Features:
 * - File-based logging with timestamped files
 * - Console pretty-printing for development
 * - Sensitive data redaction
 * - Global error handlers for uncaught exceptions
 * - Configurable log levels and output directories
 * 
 * @module logger
 * @requires pino
 * @requires fs
 * @requires path
 * @requires @/lib/config
 */

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { config } from '@/lib/config';

/**
 * Pino logger instance for application-wide logging.
 * 
 * Configured with:
 * - File output to timestamped log files
 * - Pretty-printed console output (development)
 * - Redaction of sensitive configuration values
 * - Process tag for tracking log origin
 * 
 * Global error handlers catch uncaught exceptions and unhandled rejections.
 * 
 * @type {import('pino').Logger}
 * @global
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Application started');
 * logger.error(new Error('Something went wrong'));
 * logger.debug('Debug information', { data: 'value' });
 * ```
 */

const logsFolder = config.logger.folder;

// Ensure logs folder exists
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder, { recursive: true });
}

// Safe timestamp for filename (no colons)
const timestamp = new Date().toISOString().replace(/:/g, '-');
const processTag = config.logger.processTag;
const logFile = path.join(logsFolder, `${processTag}_${timestamp}.log`);

// Base logger options
const options = {
  base: {
   tag: processTag
  },
  level: (config.logger.level).toLowerCase(),
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
  },
  transport:{
    targets: [] as any[]
  }
};

options.transport.targets.push(
    {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'yyyy-mm-dd HH:MM:ss', ignore: 'pid,hostname' }
    }
);

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

export { logger };