const logger = require('../logger');
var sendSimvaTaskToKafka = require('../utils/SimvaTaskToKafka.js');
var MinioActivity = require('./MinioActivity');
var generateStatementId = require('../utils/statementIdGenerator');

var TraceStorageActivity = new MinioActivity({});
var config = require('../config');

class LRS {
    constructor(){
    }

    updateMissingTraceElements(participant, trace) {
        const now = new Date();
        if(!trace.id) {
            trace.id = generateStatementId(trace);
        }
        if(!trace.timestamp) {
            trace.timestamp = now.toISOString();
        }
        if(!trace.version) {
            trace.version = "1.0.3";
            //trace.version = "2.0.0";
        }
        trace.stored = now.toISOString();
        trace.authority = {
            homePage: config.external_url,
            name: participant
        };
        return trace;
    }

    async sendProgressOrCompletionOfActivity(trace, participant, activityType) {
        if(trace.object && trace.object.definition && trace.object.definition.type == "https://w3id.org/xapi/seriousgames/activity-types/serious-game") {
            const initializedVerb='http://adlnet.gov/expapi/verbs/initialized';
            const progressedVerb='http://adlnet.gov/expapi/verbs/progressed';
            const completedVerb='http://adlnet.gov/expapi/verbs/completed';
            const resultExtensionProgress='https://w3id.org/xapi/seriousgames/extensions/progress';
            if(trace.verb) {
                switch(trace.verb.id) {
                    case initializedVerb:
                        logger.info("INITIALIZED ACTIVITY " . activityType);
                        var taskMessage = {
							task: 'setProgress',
							params: 'user,progress',
							object: 'Activity',
							objectId: this.id,
							user: participant,
							progress: 0
						};
						sendSimvaTaskToKafka([taskMessage]);
                      break;
                    case progressedVerb:
                        logger.info("PROGRESSED THROW ACTIVITY " . activityType);
                        var value = null;
                        if(trace.result && trace.result.extensions[resultExtensionProgress]) {
							value = trace.result.extensions[resultExtensionProgress];
						} else if(trace.result && trace.result.score && trace.result.score.scaled) {
                            value = trace.result.score.scaled;
                        }
                        logger.info(value);
                        var taskMessage = {
								task: 'setProgress',
								params: 'user,progress',
								object: 'Activity',
								objectId: this.id,
								user: participant,
								progress: value
						};
						sendSimvaTaskToKafka([taskMessage]);
                      break;
                    case completedVerb:
                        if(trace.result.completion == true) {
							logger.info("COMPLETED ACTIVITY " . activityType);
							var taskMessage = {
								task: 'setCompletion',
								params: 'user,completion',
								object: 'Activity',
								objectId: this.id,
								user: participant,
								completion: true
							};
							sendSimvaTaskToKafka([taskMessage]);
						}
                      break;
                    default: 
                        logger.info("OTHER VERB");
                }
            }
        }
    }

    async setStatement(activityType, activityId, participant, result) {
        let toret = 0;
        if(Array.isArray(result)){
            var traces= [];
            for(let traceId = 0; traceId < result.length; traceId++) {
                var trace = result[traceId];
                await this.sendProgressOrCompletionOfActivity(trace, participant, activityType);
                traces.push(this.updateMissingTraceElements(participant, trace));
            }
            response = await TraceStorageActivity.sendTracesToKafka(traces, activityId);
            toret =  { ids: response };
        } else if(!result || typeof result === 'object'){
            trace = this.updateMissingTraceElements(participant, result);
            await this.sendProgressOrCompletionOfActivity(trace, participant, activityType);
            await TraceStorageActivity.sendTracesToKafka([trace], activityId);
            toret =  { ids: response };
        } else {
            logger.info('Unknown case');
            logger.info(result.result);
            throw { message: 'Unknown case setting the statements' };
        }
        return toret;
	}
}

// ##########################################
// Module exports
// ##########################################

module.exports = LRS;