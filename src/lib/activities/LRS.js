const logger = require('../logger');
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

    async setStatement(activityId, participant, result) {
        let toret = 0;
        if(Array.isArray(result)){
            var traces= [];
            for(let traceId = 0; traceId < result.length; traceId++) {
                var trace = result[traceId];
                traces.push(this.updateMissingTraceElements(participant, trace));
            }
            response = await TraceStorageActivity.sendTracesToKafka(traces, activityId);
            toret =  { ids: response };
        } else if(!result || typeof result === 'object'){
            trace = this.updateMissingTraceElements(participant, result);
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