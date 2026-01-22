/**
 * @fileoverview Configuration management for SIMVA API.
 * Centralizes environment variable handling and application settings.
 * 
 * This module provides:
 * - Database configuration (SQLite path and file settings)
 * - API server configuration (host, port, protocol)
 * - Authentication settings (Keycloak integration)
 * - Logging configuration
 * - Environment-specific defaults
 * 
 * All settings can be overridden via environment variables for deployment flexibility.
 * 
 * @module config
 * @requires path
 */

import path from 'path';

/**
 * Main configuration object for SIMVA API.
 * Contains all application settings loaded from environment variables with sensible defaults.
 * 
 * @type {Object}
 * @property {string} appFolder - Application root folder path
 * @property {Object} db - Database configuration
 * @property {string} db.path - SQLite database directory path
 * @property {string} db.file - SQLite database filename
 * @property {string} db.complete_path - Complete path to SQLite database file
 * @property {Object} api - API server configuration
 * @property {string} api.host - Server hostname
 * @property {number} api.port - Server port number
 * @property {string} api.protocol - Server protocol (http/https)
 * @property {string} api.url - Complete server URL
 * @property {Object} auth - Authentication configuration
 * @property {string} auth.url - Keycloak server URL
 * @property {string} auth.realm - Keycloak realm name
 * @property {string} auth.client_id - Keycloak client ID
 * @property {string} auth.jwt_secret - JWT signing secret
 * @property {Object} logger - Logging configuration
 * @property {string} logger.level - Log level (debug, info, warn, error)
 * @property {string} logger.folder - Log files directory
 */
let config: any = {};

/**
 * Ports that should not be included in the API URL.
 * Standard HTTP (80) and HTTPS (443) ports are omitted from URLs.
 * 
 * @type {number[]}
 */
let ignored_ports = [80, 8080, 443];

// Application folder configuration
config.appFolder = process.env.APP_FOLDER || process.cwd();

// Database configuration
config.db = {};
config.db.path = process.env.SQLLITE_DB_PATH || '/data/db';
config.db.file = process.env.SQLLITE_DB_FILE || 'simva_data.db';
config.db.complete_path = path.join(config.db.path, config.db.file);

config.api = {};
config.api.host = process.env.SIMVA_HOST || 'simva.external.test';
config.api.port = Number(process.env.SIMVA_PORT || 443);
config.api.protocol = process.env.SIMVA_PROTOCOL || 'https';
config.api.url = config.api.protocol + '://' + config.api.host
  + ((ignored_ports.indexOf(config.api.port) !== -1) ? '' : (':' + config.api.port));

// Authentication configuration (Keycloak integration)
config.auth = {};
config.auth.url = process.env.KEYCLOAK_URL || 'https://keycloak.external.test/auth';
config.auth.realm = process.env.KEYCLOAK_REALM || 'simva';
config.auth.client_id = process.env.KEYCLOAK_CLIENT_ID || 'simva-client';
config.auth.jwt_secret = process.env.JWT_SECRET || 'default-secret-key';

// Logging configuration
config.logger = {};
config.logger.level = process.env.LOG_LEVEL || 'info';
config.logger.folder = process.env.LOG_FOLDER || path.join(config.appFolder, '../../logs');

/**
 * Exported configuration object.
 * 
 * @example
 * ```typescript
 * import { config } from '@/lib/config';
 * 
 * console.log(config.api.url); // https://simva.external.test
 * console.log(config.db.complete_path); // /data/db/simva_data.db
 * ```
 */
export { config };
