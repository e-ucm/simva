/**
 * @fileoverview Server entry point for SIMVA API.
 * Initializes database connection and starts the Express server.
 * 
 * This module:
 * - Authenticates database connection using Sequelize
 * - Starts HTTP server on configured port
 * - Handles startup errors gracefully
 * - Logs server status and errors
 * 
 * @module server
 * @requires ./app
 * @requires ./lib/db
 * @requires ./lib/config
 * @requires ./lib/logger
 */

import { Server } from 'http';
import { app } from './app.js';
import { db } from './lib/db';
import { config } from './lib/config';
import { logger } from './lib/logger';

const PORT = config.api.port;

let server: Server | null = null;

/**
 * Gracefully shutdown the server
 */
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 3 seconds
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 3000);
  } else {
    process.exit(0);
  }
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError (error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  logger.info(error.code);
  logger.error(error);

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.fatal(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.fatal(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}
/**
 * Initializes and starts the SIMVA API server.
 * 
 * @async
 * @function start
 * @returns {Promise<void>} Promise that resolves when server starts successfully
 * @throws {Error} Database connection or server startup errors
 * 
 * @example
 * ```typescript
 * // Server starts automatically when this module is executed
 * // Logs: 🚀 SIMVA API running on http://localhost:3000
 * ```
 */
async function start() {
  await db.sequelize.authenticate();

  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 SIMVA API running on 0.0.0.0:${PORT} => external : ${config.api.url}`);
    logger.info(config);
  });
  server.on('error', onError);
  
  // Handle graceful shutdown
  server.on('SIGTERM', () => shutdown('SIGTERM'));
  server.on('SIGINT', () => shutdown('SIGINT'));
  server.on('SIGHUP', () => shutdown('SIGHUP'));
}

start().catch(err => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
