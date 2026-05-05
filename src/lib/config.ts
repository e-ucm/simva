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

import ms, { StringValue } from 'ms';
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
 * @property {Object} logger - Logging configuration
 * @property {string} logger.level - Log level (debug, info, warn, error)
 * @property {string} logger.folder - Log files directory
 * @property {Object} wait - Wait and timeout settings
 * @property {Object} admin - Admin user configuration
 * @property {Object} upload - File upload settings
 * @property {Object} kafka - Kafka messaging configuration
 * @property {Object} minio - MinIO storage configuration
 * @property {Object} limesurvey - LimeSurvey integration settings
 * @property {Object} sso - SSO/Keycloak configuration
 * @property {Object} lti - LTI integration configuration
 * @property {Object} storage - Storage settings
 * @property {Object} shlink - Shlink URL shortener configuration
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
config.db.view_file_path = process.env.SQL_VIEW_FILE || 'migrate/sqlite/02-views.sql';
config.db.view_complete_path = path.join(config.appFolder, config.db.view_file_path);

config.bloomFilterBackupPath = process.env.BLOOM_FILTER_BACKUP_PATH || path.join(config.appFolder, '../bloom-filter/');
config.bloomFilterBackupFile = process.env.BLOOM_FILTER_BACKUP_FILE || 'bloom-filter-backup.json';

config.api = {};
config.api.host = process.env.SIMVA_API_HOST || 'simva.external.test';
config.api.port = Number(process.env.SIMVA_API_PORT || 3000);
config.api.external_port = Number(process.env.SIMVA_API_EXTERNAL_PORT || 443);
config.api.protocol = process.env.SIMVA_API_PROTOCOL || 'https'; 
config.api.url = config.api.protocol + '://' + config.api.host
  + ((ignored_ports.indexOf(config.api.external_port) !== -1) ? '' : (':' + config.api.external_port));


// Logging configuration
config.logger = {};
config.logger.level = process.env.LOG_LEVEL || 'debug';
config.logger.folder = process.env.LOG_FOLDER || path.join(config.appFolder, '../../logs');
config.logger.processTag = process.env.PROCESS_TAG || 'simva-api';

// Debug configuration
config.debug = process.env.DEBUG === 'true';

// Node environment
config.nodeEnv = process.env.NODE_ENV || 'development';
config.nodeExtraCaCerts = process.env.NODE_EXTRA_CA_CERTS || '/var/lib/simva/tls/ca/rootCA.pem';

// External URL
config.externalUrl = process.env.EXTERNAL_URL || 'https://external.test';

// Admin configuration
config.admin = {};
config.admin.username = process.env.ADMIN_USERNAME || 'admin';
config.admin.email = process.env.ADMIN_EMAIL || 'admin@external.test';
config.admin.password = process.env.ADMIN_PASSWORD || 'password';

// Upload configuration
config.upload = {};
config.upload.maxFileSize = Number(process.env.MAX_UPLOAD_FILE_SIZE || 33554432);

// MinIO configuration
config.minio = {};
config.minio.url = process.env.MINIO_URL || 'https://minio.external.test/';
config.minio.apiUrl = process.env.MINIO_API_URL || 'minio-api.external.test';
config.minio.ssl = process.env.MINIO_SSL !== 'false';
config.minio.port = parseInt(process.env.MINIO_PORT as string) || 443;
config.minio.accessKey = process.env.MINIO_ACCESS_KEY || 'minio';
config.minio.secretKey = process.env.MINIO_SECRET_KEY || 'secret';
config.minio.bucket = process.env.MINIO_BUCKET || 'traces';
config.minio.topicsDir = process.env.MINIO_TOPICS_DIR || 'kafka-topics';
config.minio.backupDir = process.env.MINIO_BACKUP_DIR || 'backup';
config.minio.tracesTopic = process.env.MINIO_TRACES_TOPIC || 'traces';
config.minio.stateDir = process.env.MINIO_STATE_DIR || 'state';
config.minio.outputsDir = process.env.MINIO_OUTPUTS_DIR || 'outputs';
config.minio.tracesFile = process.env.MINIO_TRACES_FILE || 'traces.json';
config.minio.presignedUrlFileExpirationTime = ms((process.env.MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME as StringValue) || ('1h' as StringValue))/1000;

// Kafka configuration
config.kafka = {};
config.kafka.host = process.env.KAFKA_HOST || 'kafka1.internal.test';
config.kafka.port = process.env.KAFKA_PORT || '9092';
config.kafka.groupId = process.env.KAFKA_GROUP_ID || 'simva-group';
config.kafka.clientId = process.env.KAFKA_CLIENT_ID || 'simva-client';
config.kafka.topic = config.minio.tracesTopic;
config.kafka.brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS : [`${config.kafka.host}:${config.kafka.port}`];

config.kafkaEvent = {};
config.kafkaEvent.host = config.kafka.host;
config.kafkaEvent.port = config.kafka.port;
config.kafkaEvent.brokers = config.kafka.brokers;
config.kafkaEvent.groupId = process.env.KAFKA_SIMVA_EVENTS_GROUP_ID || 'simva-events-group';
config.kafka.clientId = process.env.KAFKA_SIMVA_EVENTS_CLIENT_ID || 'simva-event-client';
config.kafkaEvent.topic = process.env.KAFKA_SIMVA_EVENTS_TOPIC || 'simva_events_topic';

// LimeSurvey configuration
config.limesurvey = {};
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey.external.test';
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https';
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443';
config.limesurvey.external_url = config.limesurvey.protocol + '://' + config.limesurvey.host + ((ignored_ports.indexOf(Number(config.limesurvey.port)) !== -1) ? '' : (':' + config.limesurvey.port));
config.limesurvey.useNewVersion = Boolean(process.env.LIMESURVEY_USE_NEW_VERSION);
config.limesurvey.username = process.env.LIMESURVEY_ADMIN_USER || 'admin';
config.limesurvey.password = process.env.LIMESURVEY_ADMIN_PASSWORD || 'secret';
config.limesurvey.secret = process.env.LIMESURVEY_SECRET || 'secret';
config.limesurvey.headerName = process.env.LIMESURVEY_HEADER_NAME || 'X-Signature-SHA256';
config.limesurvey.headerPrefix = process.env.LIMESURVEY_HEADER_PREFIX || '';
config.limesurvey.versionNumber = process.env.LIMESURVEY_VERSION_NUMBER || '5';

// SSO/Keycloak configuration (extended)
config.sso = {};
config.sso.enabled = process.env.SSO_ENABLED !== 'false';
config.sso.realm = process.env.SSO_REALM || 'simva';
config.sso.clientId = process.env.SSO_CLIENT_ID || 'simva';
config.sso.clientSecret = process.env.SSO_CLIENT_SECRET || 'secret';
config.sso.studentAllowedRole = process.env.SSO_STUDENT_ALLOWED_ROLE !== 'false';
config.sso.teachingAssistantAllowedRole = process.env.SSO_TEACHING_ASSISTANT_ALLOWED_ROLE !== 'false';
config.sso.teacherAllowedRole = process.env.SSO_TEACHER_ALLOWED_ROLE !== 'false';
config.sso.researcherAllowedRole = process.env.SSO_RESEARCHER_ALLOWED_ROLE !== 'false';
config.sso.sslRequired = process.env.SSO_SSL_REQUIRED || 'external';
config.sso.publicClient = process.env.SSO_PUBLIC_CLIENT === 'true';
config.sso.host = process.env.SSO_HOST || 'sso.external.test';
config.sso.protocol = process.env.SSO_PROTOCOL || 'https';
config.sso.port = process.env.SSO_PORT || '443';
config.sso.url = config.sso.protocol + '://' + config.sso.host + ((ignored_ports.indexOf(Number(config.sso.port)) !== -1) ? '' : (':' + config.sso.port));
config.sso.openIdUrl = config.sso.url + '/realms/' + config.sso.realm + '/protocol/openid-connect';
config.sso.tokenUrl = config.sso.openIdUrl + '/token';
config.sso.authUrl = config.sso.openIdUrl + '/auth';
config.sso.pluginClientId = process.env.SSO_PLUGIN_CLIENT_ID || 'simva-plugin';
config.sso.uadventureClientId = process.env.SSO_UADVENTURE_CLIENT_ID || 'uadventure';
config.sso.adminUser = process.env.SSO_ADMIN_USER || 'administrator';
config.sso.adminPassword = process.env.SSO_ADMIN_PASSWORD || 'administrator';
config.sso.webhookSubUrl = process.env.SSO_WEBHOOK_SUBURL || '/sso-events';
config.sso.webhookUrl = config.sso.url + config.sso.webhookSubUrl;

// LTI configuration
config.lti = {};
config.lti.platformClientId = process.env.LTI_PLATFORM_CLIENT_ID || 'lti_platform';
config.lti.platformSigningKey = process.env.LTI_PLATFORM_SIGNING_KEY || 'secret';

// Storage configuration
config.storage = {};
config.storage.path = process.env.SIMVA_STORAGE_PATH || '/storage/';

// Shlink configuration
config.shlink = {};
config.shlink.serverHost = process.env.SHLINK_SERVER_HOST || 'shlink.external.test';
config.shlink.port = process.env.SHLINK_PORT || '443';
config.shlink.protocol = process.env.SHLINK_PROTOCOL || 'https';
config.shlink.url = config.shlink.protocol + '://' + config.shlink.serverHost + ((ignored_ports.indexOf(Number(config.shlink.port)) !== -1) ? '' : (':' + config.shlink.port));
config.shlink.apikey = process.env.SHLINK_SERVER_API_KEY || 'password';

/**
 * Exported configuration object.
 * 
 * @example
 * ```typescript
 * import { config } from '@/lib/config';
 * 
 * logger.info(config.api.url); // https://simva.external.test
 * logger.info(config.db.complete_path); // /data/db/simva_data.db
 * logger.info(config.minio.accessKey); // minio
 * logger.info(config.sso.realm); // simva
 * ```
 */
export { config };
