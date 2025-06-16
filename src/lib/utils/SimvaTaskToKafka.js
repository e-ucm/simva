const logger = require('../logger');
var async = require('async');
var config = require('../config');
var Kafka = require('../kafka');
var mongoose = require('mongoose');
var {activityTypes, castActivityToClass} = require('../activities/activityTypes');
var Study = require('../study');

logger.info('## Connecting to Kafka: ' + config.kafka.url + " to topic : " + config.minio.task_topic+ " : " + config.kafka.taskClientId + " : " + config.kafka.taskGroupId);
const kafkaTaskClient = new Kafka(config.kafka.taskClientId, [ config.kafka.url ], config.kafka.taskGroupId, config.kafka.task_topic);
kafkaTaskClient.connectToProducer();

async function getObjectInDatabase(model, id) {
    let res = await mongoose.model(model).find({_id: id});

    if(res.length > 0) {
        return res[0];
    }else{
        return null;
    }
};

async function loadObjectModel(model, id) {
    var model=getObjectInDatabase(model, id);
    switch(model) {
        case "Activity":
            return castActivityToClass(model);
        case "Study":
            var study = new Study(model);
            return study;
        default:
            break;
    }
}

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
            case "Study":
                let obj = await loadObjectModel(msg.object, msg.objectId);
                await obj[msg.task](...paramValue);
                break;
            default:
                logger.error("Object not defined!");
                break;
        }
    }
    
    kafkaTaskClient.consumeLatestMessages(processSimvaTaskMessage);
}

module.exports = sendSimvaTaskToKafka;