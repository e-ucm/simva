/**
 * @fileoverview Database configuration and initialization for SIMVA API.
 * Sets up Sequelize with SQLite and initializes all models, views, and database functions.
 * 
 * This module provides:
 * - Sequelize instance configuration with SQLite dialect
 * - Model initialization and table setup
 * - Database views for complex queries
 * - Database utility functions
 * - Test environment support (in-memory database)
 * - Global database instance management
 * 
 * @module db
 * @requires sequelize
 * @requires ./logger
 * @requires ./models/index
 * @requires ./functions
 * @requires ./views/index
 * @requires ./config
 */

import { Sequelize, DataTypes } from 'sequelize';
import { logger } from './logger';
import { initializeModels } from './models/index';
import initFunctions from '@/lib/functions';
import views from '@/lib/views/index';
import { config } from './config';

/**
 * Database interface type definition.
 * Defines the structure of the main database object with all models, functions, and views.
 * 
 * @interface DbType
 * @property {typeof Sequelize} Sequelize - Sequelize constructor for raw queries
 * @property {Sequelize} sequelize - Main Sequelize instance for database operations
 * @property {ReturnType<typeof initializeModels>} Tables - All initialized Sequelize models
 * @property {ReturnType<typeof initFunctions>} Functions - Database utility functions
 * @property {typeof views} Views - Database views for complex queries
 */
type DbType = {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  Tables: ReturnType<typeof initializeModels>;
  Functions: ReturnType<typeof initFunctions>;
  Views: typeof views;
};

const globalForDb = globalThis as unknown as { db?: DbType };

if (!globalForDb.db) {
  const isTest = process.env.NODE_ENV === 'test';
  logger.debug(`Initializing SIMVA DB (isTest: ${isTest})`);
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: isTest ? ':memory:' : config.db.complete_path,
    logging: (sql: string) => logger.debug(sql),
  });

  globalForDb.db = {
    Sequelize,
    sequelize,
    Tables: initializeModels(sequelize, DataTypes),
    Functions: initFunctions(sequelize),
    Views: views,
  } as DbType;
}

/**
 * Main database instance for SIMVA API.
 * Provides access to all models, views, functions, and the Sequelize instance.
 * 
 * @example
 * ```typescript
 * import { db } from '@/lib/db';
 * 
 * // Access models
 * const users = await db.Tables.User.findAll();
 * 
 * // Use database functions
 * const result = await db.Functions.runViewQuery(query, params);
 * 
 * // Access views
 * const simletView = db.Views.Simlet.byId;
 * 
 * // Raw queries
 * const [results] = await db.sequelize.query('SELECT * FROM users');
 * ```
 */
export const db = globalForDb.db!;
