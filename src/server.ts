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
 * @requires @/app
 * @requires @/lib/db
 * @requires @/lib/config
 * @requires @/lib/logger
 */

import { app } from '@/app.js';
import { db } from '@/lib/db';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { Server } from 'http';
import { lrsclient } from '@/lib/utils/LRSclient';

const PORT = config.api.port;

let server: Server | null = null;

let isShuttingDown = false;
/**
 * Gracefully shutdown the server
 */
async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        if (lrsclient.lrs) await lrsclient.lrs.flush();
        lrsclient.saveToFile();
        logger.debug('LRS client state saved');
      } catch (err) {
        logger.error({err}, 'Error saving LRS client state');
      }
      try {
        await db.sequelize.close();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (err) {
        logger.error({err},'Error closing database connection');
        process.exit(1);
      }
      
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
// server.ts
import { runMigrations } from "@/lib/migrate";
import { KeycloakKeyManager } from '@/lib/keycloakKeyManager';

async function start() {
  KeycloakKeyManager.clearCache(); // Clear cache to handle potential key rotation issuesKeycloakKeyManager.clearCache(); // Clear cache to handle potential key rotation issues
  await db.sequelize.authenticate();
  await runMigrations();
  try {
    await db.Functions.runSqlFile(config.db.view_complete_path);
    logger.debug('Database views initialized successfully');
  } catch (err) {
    logger.error({err}, 'Error initializing database views:', (err as Error).message);
    throw err;
  }

  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 SIMVA API running on 0.0.0.0:${PORT} => external : ${config.api.url}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
}

start().catch(err => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
