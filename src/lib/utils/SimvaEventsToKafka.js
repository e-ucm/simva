const logger = require('../logger');
var async = require('async');

var config = require('../config');

var kafka = require('kafka-node'),
    HighLevelProducer = kafka.HighLevelProducer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.KafkaClient({kafkaHost: config.kafka.url}),
    producer = new HighLevelProducer(client);

logger.info('##SimvaEvents: Connecting to Kafka: ' + config.kafka.url);

producer.on('ready', function () {
	logger.info('Kafka producer ready!')
});
 
producer.on('error', function (err) {
	logger.info(err);
	logger.info('Unable to connect to kafka');
})

async function sendSimvaEventsToKafka(events){
    return new Promise((resolve, reject) => {
            let payloads = [];
            let responses = [];
            for (var i = events.length - 1; i >= 0; i--) {
                let event = events[i];
                payloads.push({ topic: config.kafka.events_topic, messages: JSON.stringify(event), partition: 0 });
            }

            producer.send(payloads, function (err, data) {
                if(err){
                    logger.info("Error in Kafka enqueue: " + err);
                    reject(err);
                }else{
                    logger.info("Events enqueued ok! Data: " + JSON.stringify(data));
                    resolve(responses);
                }
            });
    });
}

module.exports = sendSimvaEventsToKafka;