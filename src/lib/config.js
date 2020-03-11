
let config = {}

config.external_url = process.env.EXTERNAL_URL || 'https://simva.e-ucm.es'

config.api = {}
config.api.port  = process.env.PORT || 3000

config.logger = {}
config.logger.levels = {}
config.logger.name = 'SIMVA'

config.mongo = {}
config.mongo.host = process.env.MONGO_HOST || 3000
config.mongo.db = process.env.MONGO_DB || '/simva'
config.mongo.url = 'mongodb://'+config.mongo.host+config.mongo.db
config.mongo.test = 'mongodb://localhost:1234/tests'

config.kafka = {}
config.kafka.host = process.env.KAFKA_HOST || 'kafka'
config.kafka.port = process.env.KAFKA_PORT || 9092
config.kafka.topic = process.env.KAFKA_TOPIC || 'traces'
config.kafka.url = config.kafka.host + ':' + config.kafka.port

config.minio = {}
config.minio.url = process.env.MINIO_URL || 'minio.external.test'

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey-dev.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  config.limesurvey.protocol + '://' + config.limesurvey.host + ':' + config.limesurvey.port
config.limesurvey.external_url = process.env.LIMESURVEY_EXTERNAL || config.limesurvey.url
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword =  process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'

config.a2 = {}
config.a2.host = process.env.A2_HOST || 'a2.external.test'
config.a2.protocol = process.env.A2_PROTOCOL || 'https'
config.a2.port = process.env.A2_PORT || '443'
config.a2.url =  config.a2.protocol + '://' + config.a2.host + ':' + config.a2.port
config.a2.adminUser =  process.env.A2_ADMIN_USER || 'root'
config.a2.adminPassword =  process.env.A2_ADMIN_PASSWORD || 'password'
config.a2.external_url =  process.env.A2_EXTERNAL || 'a2.external.test'

config.analyticsbackend = {}
config.analyticsbackend.host = process.env.ANALYTICSBACKEND_HOST || config.a2.host
config.analyticsbackend.protocol = process.env.ANALYTICSBACKEND_PROTOCOL || config.a2.protocol
config.analyticsbackend.port = process.env.ANALYTICSBACKEND_PORT || config.a2.port
config.analyticsbackend.apiPath = process.env.ANALYTICSBACKEND_API || '/api/proxy/gleaner'
config.analyticsbackend.url =  config.analyticsbackend.protocol + '://' + config.analyticsbackend.host
							+ ':' + config.analyticsbackend.port + config.analyticsbackend.apiPath

module.exports = config;