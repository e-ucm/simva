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

// Consumer enabled only if env var = true
const enableConsumer = process.env.ENABLE_TASK_CONSUMER === "true";

if (enableConsumer) {
    kafkaTaskClient.consumeLatestMessages(async (message) => {
        var msg = JSON.parse(message.value);
        //logger.info(msg);
        let params = msg.params.split(",");
        let paramValue = [];
        params.forEach(element => {
            paramValue.push(msg[element]);
        });
        logger.info(msg.task);
        logger.info(paramValue.join(","));
        let res;
        var sendSimvaEventsToKafka=require("./SimvaEventsToKafka");
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
                        params:params,
                        paramValues:paramValue,
                        studyId: msg.objectId,
                        user:msg.objectUser,
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
                        params:params,
                        paramValues:paramValue,
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
    });
    logger.info("Kafka consumer enabled for this process.");
} else {
    logger.info("Kafka consumer disabled for this process.");
}

module.exports = sendSimvaTaskToKafka;