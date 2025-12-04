const logger = require('../logger');
var async = require('async');

var config = require('../config');

var Kafka = require('../kafka');
logger.info('## Connecting to Kafka: ' + config.kafka.url + " to topic : " + config.minio.events_topic+ " : " + config.kafka.eventClientId + " : " + config.kafka.eventGroupId);
const kafkaEventClient = new Kafka(config.kafka.eventClientId, [ config.kafka.url ], config.kafka.eventGroupId, config.kafka.events_topic);
kafkaEventClient.connectToProducer();

async function sendSimvaEventsToKafka(events){
    await kafkaEventClient.sendMessages(events.map(event => (typeof event === 'string' ? event : JSON.stringify(event))), 0);
}

module.exports = sendSimvaEventsToKafka;