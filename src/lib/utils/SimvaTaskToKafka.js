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
        let params = msg.params.split(",");
        let paramValue = [];
        params.forEach(element => {
            paramValue.push(msg[element]);
        });
        logger.info(msg.task);
        logger.info(paramValue.join(","));
        let res;
        var sendSimvaEventsToKafka= require("./SimvaEventToKafka");
        switch(msg.object) {
            case "Study":
                var StudiesController = require("../studiescontroller");
                if(msg.objectLoad == "true") {
                    const study = await StudiesController.loadStudy(msg.objectId);
                    logger.info(study.name);
                    res=await study[msg.task](...paramValue);
                } else {
                   res= await StudiesController[msg.task](...paramValue);
                }
                if(msg.objectEvent == "true") {
                    const message = {
                        type: msg.task,
                        studyId: msg.objectId,
                        user:req.user,
                        response:res
                    };
                    sendSimvaEventsToKafka([message]);
                }
                break;
            case "Activity":
                var ActivitiesController = require("../activitiescontroller");
                if(msg.objectLoad == "true") {
                    const act = await ActivitiesController.loadActivity(msg.objectId);
                    logger.info(act.name);
                    res=await act[msg.task](...paramValue);
                } else {
                    res = await ActivitiesController[msg.task](...paramValue);
                }
                if(msg.objectEvent == "true") {
                    const message = {
                        type: msg.task,
                        activityId: msg.objectId,
                        user:req.user.data.username,
                        response:res
                    };
                    sendSimvaEventsToKafka([message]);
                }
                break;
            default:
                logger.error("Object not defined!");
                break;
        }
    }
    
    kafkaTaskClient.consumeLatestMessages(processSimvaTaskMessage);
}

module.exports = sendSimvaTaskToKafka;