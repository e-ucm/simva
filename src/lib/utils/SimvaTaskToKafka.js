const logger = require('../logger');
var async = require('async');
var config = require('../config');
var Kafka = require('../kafka');

logger.info('## Connecting to Kafka: ' + config.kafka.url + " to topic : " + config.minio.task_topic+ " : " + config.kafka.taskClientId + " : " + config.kafka.taskGroupId);
const kafkaTaskClient = new Kafka(config.kafka.taskClientId, [ config.kafka.url ], config.kafka.taskGroupId, config.kafka.task_topic);
kafkaTaskClient.connectToProducer();

async function sendSimvaTaskToKafka(events){
    await kafkaTaskClient.sendMessages(events.map(event => (typeof event === 'string' ? event : JSON.stringify(event))), 0);
}

if(config.kafka.consumeTaskMessage) {
    async function processSimvaTaskMessage(message) {
        var msg = JSON.parse(message.value);
        logger.info(msg);
        switch(msg.object) {
            case "Activity":
                let params = msg.params.split(",");
                let paramValue = [];
                params.forEach(element => {
                    paramValue.push(msg[element]);
                });
                logger.info(paramValue.join(","));         
                let act = await require('../activitiescontroller').loadActivity(msg.objectId);
                await act[msg.task](...paramValue);
                break;
            default:
                logger.error("Object not defined!");
                break;
        }
    }
    
    kafkaTaskClient.consumeLatestMessages(processSimvaTaskMessage);
}

module.exports = sendSimvaTaskToKafka;