const ms = require("ms");
let config = {}

let ignored_ports = [80, 8080, 443];

config.external_url = process.env.EXTERNAL_URL || 'https://simva.external.test'
config.favicon_file = process.env.SIMVA_FRONT_FAVICON || '/favicon.ico'
config.favicon_url = config.external_url + config.favicon_file

config.api = {}
config.api.host = process.env.SIMVA_API_HOST || 'simva-api.simva.external.test'
config.api.port  = process.env.SIMVA_API_PORT || 443
config.api.protocol = process.env.SIMVA_API_PROTOCOL
config.api.url = config.api.protocol + '://' + config.api.host
			+ ( (ignored_ports.indexOf(config.api.port) !== -1) ? '' : (':' + config.api.port) );
config.api.webhookPath = process.env.SIMVA_API_WEBHOOK_PATH || '/users/events'
config.api.webhookSecret = process.env.SIMVA_API_WEBHOOK_SECRET || 'w3bh00k_s3cr3t'
config.api.webhookUrl = config.api.url + config.api.webhookPath
config.api.adminUsername = process.env.ADMIN_USERNAME || 'admin'
config.api.adminEmail = process.env.ADMIN_EMAIL || 'admin@simva.admin'
config.api.adminPassword = process.env.ADMIN_PASSWORD || 'password'
config.api.maxUploadFileSize = process.env.MAX_UPLOAD_FILE_SIZE || '33554432'
config.api.profiling = process.env.ENABLE_DEBUG_PROFILING == undefined ? "false" : (process.env.ENABLE_DEBUG_PROFILING == "true")

config.JWT = {}
config.JWT.issuer = 'simva'
config.JWT.expiresIn = '24h'
config.JWT.secret = 's3cret'

config.logger = {}
config.logger.levels = {}
config.logger.name = 'SIMVA'

config.mongo = {}
config.mongo.host = process.env.MONGO_HOST || 3000
config.mongo.db = process.env.MONGO_DB || '/simva'
config.mongo.ltidb = process.env.LTI_MONGO_DB || '/lti_simva'
config.mongo.url = 'mongodb://'+config.mongo.host+config.mongo.db
config.mongo.ltiurl = 'mongodb://'+config.mongo.host+config.mongo.ltidb
config.mongo.test = config.mongo.url

config.kafka = {}
config.kafka.host = process.env.KAFKA_HOST || 'kafka'
config.kafka.port = process.env.KAFKA_PORT || 9092
config.kafka.url = config.kafka.host + ':' + config.kafka.port
config.kafka.events_topic = process.env.KAFKA_EVENTS_TOPIC || 'simva_events_topic'
config.kafka.eventClientId =  process.env.KAFKA_EVENTS_CLIENT_ID !== undefined ? process.env.KAFKA_EVENTS_CLIENT_ID : 'simva_events'
config.kafka.eventGroupId  = process.env.KAFKA_EVENTS_GROUP_ID !== undefined ?  process.env.KAFKA_EVENTS_GROUP_ID : 'simva_events'
config.kafka.traceClientId =  process.env.KAFKA_TOPIC_CLIENT_ID !== undefined ? process.env.KAFKA_TOPIC_CLIENT_ID : 'simva_trace'
config.kafka.traceGroupId = process.env.KAFKA_TOPIC_GROUP_ID !== undefined ? process.env.KAFKA_TOPIC_GROUP_ID : 'simva_trace'

config.minio = {}
config.minio.url = process.env.MINIO_URL || 'minio.external.test'
config.minio.api_host = process.env.MINIO_API_URL || 'minio-api.external.test'
config.minio.useSSL = process.env.MINIO_SSL !== undefined ? (process.env.MINIO_SSL.toLocaleLowerCase() === 'false' ? false : true) : false,
config.minio.port = process.env.MINIO_PORT !== undefined ? parseInt(process.env.MINIO_PORT) : undefined,
config.minio.access_key = process.env.MINIO_ACCESS_KEY
config.minio.secret_key = process.env.MINIO_SECRET_KEY
config.minio.port = process.env.MINIO_PORT || 80
config.minio.bucket = process.env.MINIO_BUCKET || 'traces'
config.minio.topics_dir = process.env.MINIO_TOPICS_DIR || 'kafka-topics'
config.minio.traces_topic = process.env.MINIO_TRACES_TOPIC || 'traces'
config.minio.outputs_dir = process.env.MINIO_OUTPUTS_DIR || 'outputs'
config.minio.presigned_url_expiration_time_in_second = process.env.MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME !== undefined ? ms(process.env.MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME)/1000 : ms("1h")/1000
config.minio.traces_file = process.env.MINIO_TRACES_FILE || 'traces.json'

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey-dev.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  config.limesurvey.protocol + '://' + config.limesurvey.host + ':' + config.limesurvey.port
config.limesurvey.external_url = process.env.LIMESURVEY_EXTERNAL || config.limesurvey.url
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword =  process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'
config.limesurvey.SECRET =  process.env.LIMESURVEY_SECRET || null

config.sso = {}
config.sso.enabled = process.env.SSO_ENABLED == 'true' || false
config.sso.realm = process.env.SSO_REALM || 'simva'
config.sso.clientId = process.env.SSO_CLIENT_ID || 'simva'
config.sso.clientSecret = process.env.SSO_CLIENT_SECRET || 'th1s_1s_th3_s3cr3t'
config.sso.sslRequired = process.env.SSO_SSL_REQUIRED || 'external'
config.sso.publicClient = process.env.SSO_PUBLIC_CLIENT || 'false'
config.sso.host = process.env.SSO_HOST || 'sso.simva.e-ucm.es'
config.sso.protocol = process.env.SSO_PROTOCOL || 'https'
config.sso.port = parseInt(process.env.SSO_PORT || '443')
config.sso.url = config.sso.protocol + '://' + config.sso.host
			+ ( (ignored_ports.indexOf(config.sso.port) !== -1) ? '' : (':' + config.sso.port) );
config.sso.webhookPath = process.env.SSO_WEBHOOK_PATH || '/webhook'
config.sso.realmUrl = config.sso.url + '/realms/' + config.sso.realm
config.sso.tokenUrl=config.sso.realmUrl + '/protocol/openid-connect/token'
config.sso.webhookUrl = config.sso.realmUrl + config.sso.webhookPath
config.sso.publicKey = "-----BEGIN PUBLIC KEY----- \n" + process.env.SSO_PUBLIC_KEY + "\n-----END PUBLIC KEY-----\n";
config.sso.studentAllowedRole = (process.env.SSO_STUDENT_ALLOWED_ROLE === "true") ? "student" : null
config.sso.teachingAssistantAllowedRole = (process.env.SSO_TEACHING_ASSISTANT_ALLOWED_ROLE === "true") ? "teaching-assistant" :  null
config.sso.teacherAllowedRole = (process.env.SSO_TEACHER_ALLOWED_ROLE === "true") ? "teacher" :  null
config.sso.researcherAllowedRole = (process.env.SSO_RESEARCHER_ALLOWED_ROLE === "true") ? "researcher" :  null
config.sso.allowedRoles = [config.sso.researcherAllowedRole, config.sso.teacherAllowedRole, config.sso.teachingAssistantAllowedRole, config.sso.studentAllowedRole ]
	.filter(role => role !== null)
	.join(',');
config.sso.loggerActive = process.env.SSO_LOGGER_ACTIVE || false;

config.sso.adminUser = process.env.SSO_ADMIN_USER || 'admin';
config.sso.adminPassword = process.env.SSO_ADMIN_PASSWORD || 'password';

config.LTI = {}
config.LTI.platform = {}
config.LTI.platform.client_id = process.env.LTI_PLATFORM_CLIENT_ID || 'lti-platform'
config.LTI.platform.key = process.env.LTI_PLATFORM_SIGNING_KEY || 'LTISIGNINGKEY';
config.LTI.platform.mongo = {}
config.LTI.platform.mongo.db = process.env.LTI_PLATFORM_DB_NAME || '/lti'
config.LTI.platform.mongo.url = 'mongodb://'+config.mongo.host+config.LTI.platform.db
config.LTI.platform.mongo.user = process.env.LTI_PLATFORM_DB_USER || 'root'
config.LTI.platform.mongo.password = process.env.LTI_PLATFORM_DB_PASSWORD || ''
config.LTI.platform.claims_url = '/lti/claims';
config.LTI.loggerActive = process.env.LTI_LOGGER_ACTIVE || true;
config.LTI.debug= process.env.LTI_DEBUG || false;

config.storage = {}
config.storage.path = process.env.SIMVA_STORAGE_PATH || 'storage/'

config.shlink = {}
config.shlink.apihost = process.env.SHLINK_SERVER_HOST || 'shlink.external.test'
config.shlink.protocol = process.env.SHLINK_PROTOCOL || 'https'
config.shlink.port = process.env.SHLINK_PORT || '443'
config.shlink.apiurl =  `${config.shlink.protocol}://${config.shlink.apihost}:${config.shlink.port}`
config.shlink.apikey = process.env.SHLINK_SERVER_API_KEY || 'myapikey'

module.exports = config;