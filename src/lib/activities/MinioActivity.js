const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('../config');
var sendSimvaEventsToKafka = require('../utils/SimvaEventsToKafka.js');
var sendSimvaTaskToKafka = require('../utils/SimvaTaskToKafka');
var Kafka = require('../kafka')
logger.info('## MinioActivity: Connecting to Kafka: ' + config.kafka.url + " to topic : " + config.minio.traces_topic + " : " + config.kafka.traceClientId + " : " + config.kafka.traceGroupId);
const kafkaClient = new Kafka(config.kafka.traceClientId, [ config.kafka.url ], config.kafka.traceGroupId, config.minio.traces_topic);
kafkaClient.connectToProducer();

class MinioActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(!this.extra_data.participants){
			this.extra_data.participants = [];
		}
	}

	async getCompleteActivity(objectUser) { 
		var activityResultTask={
			task: 'hasResults',
			params: '',
			object: 'Activity',
			objectEvent: 'true',
			objectLoad: 'true',
			objectUser: objectUser,
			objectId: this._id
		};
		await sendSimvaTaskToKafka([activityResultTask]);
		return super.getCompleteActivity();
	}

	async export(complete) {
		let activity = super.export();
		return activity;
	}

	static getType(){
		return 'miniokafka';
	}

	static getName(){
		return 'Minio-Kafka Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that sends the traces to kafka for later to be saved in minio.';
	}

	static async getUtils(username){
		return {
			minio_url: config.minio.url,
			minio_bucket: config.minio.bucket,
			topics_dir: config.minio.topics_dir,
			trace_topic: config.minio.traces_topic,
			users_dir: config.minio.users_dir,
			user_folder: username,
			file_name: config.minio.file_name
		};
	}

	async getDetails(){
		return {};
	}

	set params(params){
		super.params = params;

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
	}

	patch(params) {
		super.patch(params);
	}

	async save(){
		if(!this.extra_data){
			this.extra_data = {};
		}

		return await super.save();
	}

	async remove(){
		return await super.remove();
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		return await super.addParticipants(participants);
	}

	async removeParticipants(participants){
		return await super.removeParticipants(participants);
	}

	async setResult(participant, result){
		const message = {
			type: 'activity_result',
			activityType : this.type,
			activityId: this.id,
			studyId: this.study,
			user: participant
		};
		sendSimvaEventsToKafka([message]);
		let toret = 0;
		try{
			if(Array.isArray(result)){
				// If we're receiving an array, we're receiving traces
				await this.sendTracesToKafka(result, this.id);
				return { message: 'Traces Enqueued' };
			}else if(!result || typeof result === 'object'){
				// If these conditions are satisfied, we're receiving an start
				if(result && result.result){
					await super.setResult(participant, result);
					return { message: 'Results Saved' };
				}else{
					toret = { 
						actor: {
							account: { homePage: config.external_url, name: participant },
							name: participant
						},
						playerId: participant,
						objectId: config.external_url + '/activities/' + this.id,
					}
				}
			}
		}catch(e){
			logger.error(e);
			throw { message: 'Error while setting the result' };
		}


		return toret;
	}

	async sendTracesToKafka(traces, activityId){
		let payloads = [];
		let responses = [];
		for (var i = traces.length - 1; i >= 0; i--) {
			let trace = traces[i];
			responses.push(trace.id);
			payloads.push(JSON.stringify(trace));
		}
		await kafkaClient.sendMessages(payloads, 0, JSON.stringify({ _id: activityId }));
		return responses;
	}

	async getResults(participants, type){
		return super.getResults(participants, type);
	}

	async hasResults(participants, type){
		return super.getResults(participants, type);
	}

	async setCompletion(participant, status){
		return super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		return super.getCompletion(participants);
	}

	async target(participants){
		return false;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = MinioActivity;