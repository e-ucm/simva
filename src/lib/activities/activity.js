const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
let fs = require('fs');
var ObjectId = mongoose.Types.ObjectId;
const { Client } = require('minio');

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

var config = require('../config');
let { v4: uuidv4} = require('uuid');
var sendSimvaEventsToKafka = require('../utils/SimvaEventsToKafka');
var { isoToDuration } = require('../utils/date');

class Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		this.extra_data = {};
		this.owners = [];

		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
	}

	toObject(){
		var params = {};
		for(var p in activityschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	static getType(){
		return 'activity';
	}

	static getName(){
		return 'Default Activity';
	}

	static getDescription(){
		return 'A basic activity with completion state and a place to save results.';
	}

	static async getUtils(username){
		return {};
	}

	async getDetails(){
		return {};
	}

	set params(params){
		for(var p in activityschema.properties){
			if(params[p]){
				this[p] = params[p]
			}
		}

		if(params['_id']){
			this._id = params['_id'];
		}
	}


	set id(id){
		if(!ObjectId.isValid(id)){
			throw {message: 'not a valid objectId'};
		}else{
			this._id = id;
		}
	}

	get id(){
		return this._id;
	}

	async load(){
		var res = await mongoose.model('activity').find({_id: this.id});

		if(res.length > 0) {
			for(var k in res[0]){
				this[k] = res[0][k];
			}
			return true;
		}

		return false;
	}

	patch(params) {
		if(typeof params.name !== 'undefined') {
			this.name = params.name;
		}
	}

	async save(){
		var params = {};

		for(var p in activityschema.properties){
			params[p] = this[p];
		}

		if(this.id){
			params['_id'] = this.id;
		}

		if(params._id){
			var result = await mongoose.model('activity').updateOne({ _id: this.id }, params);
			if(result.ok !== result.n){
				throw { message: 'Error saving the activity' };
			}
		}else{
			var activity = new mongoose.model('activity')(params);
			await activity.save();
			this.id = activity._id;
		}
		

		return true;
	}

	async remove(){
		var res = await mongoose.model('activity').deleteOne({_id: this.id});

		return true;
	}

	// ##########################################
	// Activity-related functions
	// ##########################################

	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		if(!this.extra_data){
			this.extra_data = { participants: {} };
		}
		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
		logger.debug("Before adding participants : " + JSON.stringify(this));

		for(let i = 0; i < participants.length; i++){
			if(!this.extra_data.participants[participants[i]]){
				this.extra_data.participants[participants[i]] = { completion: false };
			}
		}
		logger.debug("After adding participants : " + JSON.stringify(this));
		return await this.save();
	}

	async removeParticipants(participants){
		logger.debug("Before delete participants : " + JSON.stringify(this));
		for (var i = 0; i < participants.length; i++) {
			delete this.extra_data.participants[participants[i]];
		}
		logger.debug("Before delete participants : " + JSON.stringify(this));
		return await this.save();
	}

	async addOwners(owners) {
		for(var i = 0; i < owners.length; i++) {
			this.owners.push(owners[i]);       
		}
		return await this.save();
	}
	
	async removeOwners(owners) {
		for(var i = 0; i < owners.length; i++) {
			this.owners.pop(owners[i]);
		}
		return await this.save();
	}
	
	async sendXAPITraceForActivity(user,verb, timestamp, resultScore=null) {
		try {
			logger.info(`sendXAPITraceForActivity ${this.name}`);
			logger.info(`User : ${user} | verb : ${verb} | timestamp : ${timestamp} | resultScore : ${resultScore}`);
			if(!this.extra_data){
				this.extra_data = { participants: {} };
			}
			if(!this.extra_data.participants){
				this.extra_data.participants = {};
			}
			if(!this.extra_data.participants[user]){
				this.extra_data.participants[user] = {};
			}
			let registrationid = this.extra_data.participants[user].registrationid;
			let startedTimestamp = this.extra_data.participants[user].timestamp;
			var attemptId= this.extra_data.participants[user].attemptId;
			var suspended = this.extra_data.participants[user].suspended;
			let verbXAPI;
			let result;
			switch(verb) {
				case "Initialized":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/initialized",
						"display": {
							"en-US": "initialized"
						}
					};
					if(suspended) {
						logger.info("Already Initialized");
						verbXAPI = {
							"id":"http://adlnet.gov/expapi/verbs/resumed",
							"display": {
								"en-US": "resumed"
							}
						};
					} else {
						registrationid=uuidv4();
						this.extra_data.participants[user].registrationid = registrationid;
					}
					attemptId=uuidv4();
					this.extra_data.participants[user].attemptId=attemptId;
					this.extra_data.participants[user].timestamp=timestamp;
					delete this.extra_data.participants[user].suspended;
					await this.save();
					break;
				case "Terminated":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/terminated",
						"display": {
							"en-US": "terminated"
						}
					};
					result= {
						duration: isoToDuration(startedTimestamp, timestamp),
					};
					if(!registrationid) {
						return;
					}
					break;
				case "Progressed":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/progressed",
						"display": {
							"en-US": "progressed"
						}
					};
					result= {
						score: {
							scaled: resultScore
						}
					};
					if(!registrationid) {
						return;
					}
					break;
				case "Resumed":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/resumed",
						"display": {
							"en-US": "resumed"
						}
					};
					this.extra_data.participants[user].timestamp=timestamp;
					attemptId=uuidv4();
					this.extra_data.participants[user].attemptId=attemptId;
					await this.save();
					if(!registrationid) {
						return;
					}
					break;
				case "Suspended":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/suspended",
						"display": {
							"en-US": "suspended"
						}
					};
					result= {
						duration: isoToDuration(startedTimestamp, timestamp),
					};
					if(!registrationid) {
						return;
					}
					break;
				case "Completed":
					verbXAPI = {
						"id":"http://adlnet.gov/expapi/verbs/completed",
						"display": {
							"en-US": "completed"
						}
					};
					if(!registrationid) {
						return;
					}
					break;
				default:
					logger.info(`${verb} not defined`);
					return;
			}
			var statement = {
				actor: {
					account: {
						homePage: config.external_url,
						name: user
					}
				},
				verb: verbXAPI,
				object: {
					id: `${config.external_url}/studies/${this.study}/activity/${this._id}`,
					definition: {
						name: {
							"en-US": this.name
						},
						description:  {
							"en-US":`An activity ${this.name} of study ${this.study}`
						},
						"type": "http://adlnet.gov/expapi/activities/lesson"
					}
				},
				"context": {
					grouping: [{
						id: `${config.external_url}/studies/${this.study}`,
						definition: {
							name:  {
								"en-US": `${this.study}`,
							},
							description:  {
								"en-US":`The activity representing the study ${this.study}`
							},
							"type": "http://adlnet.gov/expapi/activities/course"
						}
					},
					{
						id: `${config.external_url}/studies/${this.study}/activity/${this._id}?id=${attemptId}`,
						definition: {
							name:  {
								"en-US": `Attempt of activity ${this._id}`
							},
							description:  {
								"en-US": `The activity representing an attempt of activity ${this._id} in study ${this.study}`
							},
							"type": "http://adlnet.gov/expapi/activities/attempt"
						}
					},
					],
					"contextActivities": {
						"category": [{
							"id":"https://w3id.org/xapi/scorm",
							"definition": {
								"type":"http://adlnet.gov/expapi/activities/profile"
							}
						}]
					},
					"registration": registrationid
				},
				"timestamp": timestamp
			};
			switch(verb) {
				case "Terminated":
					delete this.extra_data.participants[user].attemptId;
					delete this.extra_data.participants[user].timestamp;
					delete this.extra_data.participants[user].registrationid;
					await this.save();
					break;
				case "Suspended":
					delete this.extra_data.participants[user].attemptId;
					delete this.extra_data.participants[user].timestamp;
					await this.save();
					break;
				default:
					logger.info("Nothing to do.");
			}
			if(result !== null) {
				statement.result=result;
			}
			logger.info(JSON.stringify(statement));
			const LRS = require('./LRS');
			var LRSManager = new LRS();
			await LRSManager.setStatement(this._id, user, [statement]);
		} catch(e) {
			logger.error(e);
		}
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
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}

		this.extra_data.participants[participant].result = result.result;

		let toret = { result: await this.save() };
		
		if(result.tofile === true){
			await this.saveToFile(participant + '.result', result.result);
		}

		return toret;

	}
	async saveToFile(filename, content){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let savefile = function(){
					let fullname = config.storage.path + activity._id + '/' + filename;

                	// Ensure content ends with a newline character
                	let contentWithNewline = content.endsWith('\n') ? content : content + '\n';
					fs.appendFile(fullname, contentWithNewline, function(error) {
						if(error) {
							reject({ message: 'Unable to save file: "' + fullname + '".', error: error})
						}else{
							resolve();
						}
					});
				}

				let checkSubfolder = function(){
					fs.stat(config.storage.path + activity._id, function(error, stats){
						if(error){
							logger.info('Folder does not exist');
							fs.mkdir(config.storage.path + activity._id, function(error){
								if(error){
									reject({ message: 'Unable to create the subdirectory.', error: error })
								}else{
									savefile();
								}
							})
						}else{
							savefile();
						}
					})
				}

				fs.stat(config.storage.path, function(error, stats){
					if(error){
						fs.mkdir(config.storage.path, function(error){
							if(error){
								reject({ message: 'Unable to create the base directory.', error: error })
							}else{
								checkSubfolder();
							}
						})
					}else{
						checkSubfolder();
					}
				})
			}catch(e){
				logger.error(e);
				reject({ message: 'error saving to file', error: e });
			}
		});
	}

	async readFromFile(filename){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let fullname = config.storage.path + activity._id + '/' + filename;

				fs.readFile(fullname, 'utf8', function(error, result) {
					if(error) {
						reject({ message: 'Unable to read file: "' + fullname + '".', error: error})
					}else{
						resolve(result);
					}
				});
			}catch(e){
				logger.error(e);
				reject({ message: 'Error reading file', error: e });
			}
		});
	}

	async fileExists(filename){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let fullname = config.storage.path + activity._id + '/' + filename;

				fs.stat(fullname, 'utf8', function(error, result) {
					if (err == null) {
						resolve(true);
					} else if (error.code === 'ENOENT') {
						resolve(false);
					} else {
						logger.error(error);
						reject({message: 'Unexpected error', error: error});
					}
				});
			}catch(e){
				logger.error(e);
				reject({ message: 'Error reading file', error: e });
			}
		});
	}

	async getResults(participants, type){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].result){
					results[participants[i]] = this.extra_data.participants[participants[i]].result;
				}else{
					results[participants[i]] = null;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = null;
			}
		}

		return results;
	}

	async hasResults(participants, type){
		let results = await this.getResults(participants);

		if(participants.length === 0){
			participants = Object.keys(results);
		}
		
		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = (results[participants[i]] !== null);
		}

		return results;
	}

	async getProgress(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].progress){
					results[participants[i]] = this.extra_data.participants[participants[i]].progress;
				}else{
					results[participants[i]] = 0;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = 0;
			}
		}

		return results;
	}

	async setProgress(participant, progress){
		let num = parseFloat(progress); // Convert string to number
		let roundedProgress = parseFloat(num.toFixed(3)); // Round to 3 decimal places
		const message = {
			type: 'activity_progressed',
			activityType : this.type,
			activityId: this.id,
			studyId: this.study,
			user: participant,
			val: roundedProgress
		};
		sendSimvaEventsToKafka([message]);
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}
		if(roundedProgress <= 1) {
			this.extra_data.participants[participant].progress = roundedProgress;
		}
		return await this.save();
	}

	async setSuspension(participant) {
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}

		this.extra_data.participants[participant].suspended = true;
		
		return await this.save();
	}

	async setCompletion(participant, status){
		const message = {
			type: 'activity_completed',
			activityType : this.type, 
			activityId: this.id,
			studyId: this.study,
			status: status,
			user: participant
		};
		sendSimvaEventsToKafka([message]);
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}

		this.extra_data.participants[participant].completion = status;
		
		return await this.save();
	}

	async getCompletion(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].completion){
					results[participants[i]] = this.extra_data.participants[participants[i]].completion;
				}else{
					results[participants[i]] = false;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = false;
			}
		}

		return results;
	}

	async target(participant){
		return false;
	}

	open(res, participant){
		return false;
	}

	async getStudy(){
		let res = null;

		let tests = await mongoose.model('test').find({ activities:  this._id });


		if(tests.length > 0){
			let studies = await mongoose.model('study').find({ tests:  tests[0]._id });

			res = studies[0];
		}

		return res;
	}

	export() {
		var activity = {};
		activity.name = this.name;
		activity.type = this.type;
		activity.owners = this.owners;
		activity.extra_data = this.extra_data;
		delete activity.extra_data;
		delete activity._id;
		delete activity.id;
		return activity;
	}

	initializeMinioClient() {
		logger.info("MinioClient");
		logger.info(`Minio Config - Host: ${config.minio.api_host}, Port: ${config.minio.port}, SSL: ${config.minio.useSSL}`);
		try {
			const minioClient = new Client({
				endPoint: config.minio.api_host,
				port: Number(config.minio.port),
				accessKey: config.minio.access_key,
				secretKey: config.minio.secret_key,
				useSSL: config.minio.useSSL
			});
			logger.info("MinioClient connected");
			return minioClient;
		} catch (error) {
			logger.error("Error initializing MinioClient: ");
			logger.error(error);
			throw error;
		}
	}

	async generatePresignedFileUrl() {
		let path = `${config.minio.outputs_dir}/${this._id}/${config.minio.traces_file}`;
		logger.info(path);
		let minioClient = this.initializeMinioClient();
		if (await this.fileExists(minioClient, path)) {
			let presignedUrl = null;	
			let time_before_expiration=config.minio.presigned_url_expiration_time_in_second;
			presignedUrl = await this.getPresignedUrl(minioClient, path, time_before_expiration);
			const now=new Date().toJSON();
			this.extra_data.miniotrace={
				presignedUrl:presignedUrl,
				generated_at:now,
				expire_on_seconds:time_before_expiration
			};
		} else {
			throw `Error the file ${path} don't exist in minio`;
		}
	}

	/**
	 * Retrieve file content from Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} file - File path
	 * @returns {Promise<string>}
	 */
	async getFile(minioClient, file) {
		try {
			const objectStream = await minioClient.getObject(config.minio.bucket, file);
			objectStream.setEncoding('utf-8');
	
			let content = '';
			for await (const chunk of objectStream) {
				content += chunk;
			}
	
			return content;
		} catch (err) {
			logger.error(`Error fetching file: ${err.message}`);
			throw err;
		}
	}
	
	/**
	 * Check if the file exists in Minio bucket
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<boolean>}
	 */
	async fileExists(minioClient, path) {
		logger.debug("Minio : fileExists");
		try {
			const objectsStream = await minioClient.listObjectsV2(config.minio.bucket, path);
			const iterator = objectsStream[Symbol.asyncIterator]();
			const nextValue = await iterator.next();
			return !nextValue.done;
		} catch (err) {
			logger.error(`Error checking file existence: ${err.message}`);
			return false;
		}
	}
	
	/**
	 * Generate a presigned URL for a file in Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<string>}
	 */
	async getPresignedUrl(minioClient, path, time) {
		logger.info("Minio : getPresignedUrl");
		try {
			const presignedUrl = await minioClient.presignedGetObject(config.minio.bucket, path, time);
			logger.info(presignedUrl);
			return presignedUrl;
		} catch (err) {
			logger.error(`Error generating presigned URL: ${err.message}`);
			throw err;
		}
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Activity;