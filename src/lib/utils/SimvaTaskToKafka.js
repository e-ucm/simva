const logger = require('../logger');
var async = require('async');
var config = require('../config');
var Kafka = require('../kafka');
var activitiescontroller = require('../activitiescontroller');
var studyController = require('../studiescontroller');

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
        let params = msg.params.split(",");
        let paramValue = [];
        params.forEach(element => {
            paramValue.push(msg[element]);
        });
        logger.info(paramValue.join(","));
        switch(msg.object) {
            case "Activity":
                let act = await activitiescontroller.loadActivity(msg.objectId);
                await act[msg.task](...paramValue);
                break;
            case "Study":
                await studyController[msg.task](...paramValue);
            default:
                logger.error("Object not defined!");
                break;
        }
    }
    
    kafkaTaskClient.consumeLatestMessages(processSimvaTaskMessage);
}

module.exports = sendSimvaTaskToKafka;