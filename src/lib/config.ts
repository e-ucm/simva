import path from 'path';

let config: any = {};

let ignored_ports = [80, 8080, 443];

config.appFolder = process.env.APP_FOLDER || process.cwd();

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

config.logger = {};
config.logger.level = process.env.LOG_LEVEL || 'info';
config.logger.folder = process.env.LOG_FOLDER || path.join(config.appFolder, '../../logs');

export { config };
