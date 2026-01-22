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

import { app } from './app.js';
import { db } from './lib/db';
import { config } from './lib/config';
import { logger } from './lib/logger';

const PORT = config.api.port;

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

  app.listen(PORT, () => {
    logger.info(`🚀 SIMVA API running on ${config.api.url}`);
  });
}

start().catch(err => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
