const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');
const {ScalableBloomFilter} = require('bloom-filters')
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');
var Activity = require('./activity');
var config = require('../config');
const fs = require('fs');

// by default it creates an ideally scalable bloom filter for 8 elements with an error rate of 0.01 and a load factor of 0.5
const filter = new ScalableBloomFilter();
const filterFilePath = `${config.storage.filterFolderPath}/filter.json`;
importFilter();

//IMPORT EXPORT FILTER FUNCTIONS
function exportFilter() {
	// Convert JSON object to string
	const data = filter.saveAsJSON();
	const myJSON = JSON.stringify(data);
	// Write JSON string to a file
	fs.writeFile(filterFilePath, myJSON, (err) => {
  		if (err) {
    		throw err;
  		}
  		console.log('JSON data is saved.');
	});
}

function importFilter() {
	// Check if the file exists
	if (fs.existsSync(filterFilePath)) {
		// Read the file
		fs.readFile(filterFilePath, 'utf-8', (err, data) => {
			if (err) {
				console.error('Error reading the file:', err);
				return;
			}
			try {
				// Parse the JSON data
				const jsonObject = JSON.parse(data);
				console.log('JSON Object:', jsonObject);
				// Convert JSON object to a bloom Filter
				filter = BloomFilter.fromJSON(data);
			} catch (parseErr) {
				console.error('Error parsing JSON:', parseErr);
			}
		});
	} else {
		console.log('File does not exist.');
	}
}

var kafka = require('kafka-node'),
    HighLevelProducer = kafka.HighLevelProducer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.KafkaClient({kafkaHost: config.kafka.url}),
    producer = new HighLevelProducer(client);

logger.info('## MinioActivity: Connecting to Kafka: ' + config.kafka.url);

producer.on('ready', function () {
	logger.info('Kafka producer ready!')
});
 
producer.on('error', function (err) {
	logger.info(err);
	logger.info('Unable to connect to kafka');
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

	generateStatementId(trace) {
		var traceid
		if(trace.id == null) {
			traceid = uuidv4();
		} else {
			traceid = trace.id;
		}
		while(filter.has(traceid)) {
			traceid = uuidv4();
		}
		return traceid;
	}

	async sendTracesToKafka(traces, activityId){
		return new Promise((resolve, reject) => {
				let payloads = [];

				for (var i = traces.length - 1; i >= 0; i--) {
					let trace = traces[i];
					trace.id = this.generateStatementId(trace);
					filter.add(trace.id);
					payloads.push({ topic: config.minio.traces_topic, key: JSON.stringify({ _id: activityId }), messages: JSON.stringify(trace), partition: 0 });
				}
				exportFilter();
				producer.send(payloads, function (err, data) {
					if(err){
						logger.info("Error in Kafka enqueue: " + err);
						reject(err);
					}else{
						logger.info("Trace enqueued ok! Data: " + JSON.stringify(data));
						resolve(data);
					}
				});
		});
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