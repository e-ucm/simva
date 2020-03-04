const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('..//config');

var kafka = require('kafka-node'),
    HighLevelProducer = kafka.HighLevelProducer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.KafkaClient({kafkaHost: config.kafka.url}),
    producer = new HighLevelProducer(client);

console.log('## MinioActivity: Connecting to Kafka: ' + config.kafka.url);

producer.on('ready', function () {
	console.log('Kafka producer ready!')
});
 
producer.on('error', function (err) {
	console.log(err);
	console.log('Unable to connect to kafka');
})

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
			minio_url: config.minio.url
		};
	}

	set params(params){
		super.params = params;

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
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
		return await super.removeParticipants();
	}

	async setResult(participant, result){
		let toret = 0;
		try{
			if(Array.isArray(result)){
				// If we're receiving an array, we're receiving traces
				await this.sendTracesToKafka(result);
				return { message: 'Traces Enqueued' };
			}else if(!result || typeof result === 'object'){
				// If these conditions are satisfied, we're receiving an start
				if(result && result.result){
					await super.setResult(participant, result);
					return { message: 'Results Saved' };
				}else{
					toret = { 
						actor: {
							account: { homePage: config.external_url, username: participant },
							name: participant
						},
						playerId: participant,
						objectId: config.external_url + '/activities/' + this.id,
					}
				}
			}
		}catch(e){
			console.log(e);
			throw { message: 'Error while setting the result' };
		}

		return toret;
	}

	async sendTracesToKafka(traces){
		return new Promise((resolve, reject) => {
				let payloads = [];

				for (var i = traces.length - 1; i >= 0; i--) {
					let trace = traces[i];
					trace._id = this.id;
					payloads.push({ topic: config.kafka.topic, key: JSON.stringify({ _id: this.id }), messages: JSON.stringify(trace), partition: 0 });
				}

				producer.send(payloads, function (err, data) {
					if(err){
						reject(err);
					}else{
						resolve(data);
					}
				});
		});
	}

	async getResults(participants){
		return super.getResults(participants);
	}

	async setCompletion(participant, status){
		return super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		return super.getCompletion(participants);
	}

	target(participants){
		return false;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = MinioActivity;