const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');
const { Client } = require('minio');

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const https = require('https');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');
const unzipper = require('unzipper');
const pipelineAsync = promisify(pipeline);

var Activity = require('./activity');
var MinioActivity = require('./MinioActivity');
var RageAnalyticsActivity = require('./RageAnalyticsActivity');
var generateStatementId = require('../utils/statementIdGenerator');
var sseSimvaClientManager = require('../utils/sseClientsListManager');

var RealtimeActivity = new RageAnalyticsActivity({});
var TraceStorageActivity = new MinioActivity({});

var UsersController = require('../userscontroller');

var config = require('../config');

class GameplayActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(!this.id){
			if(!this.extra_data.config){
				this.extra_data.config = {
					trace_storage: false,
					realtime: false,
					backup: false
				};
			}

			if(params.trace_storage && params.trace_storage === true){
				this.extra_data.config.trace_storage = true;
			}

			if(params.realtime && params.realtime === true){
				this.extra_data.config.realtime = true;
				this.extra_data.analytics = {};
			}

			if(params.backup && params.backup === true){
				this.extra_data.config.backup = true;
			}

			if(!this.extra_data.participants){
				this.extra_data.participants = [];
				this.extra_data.analytics = {};
			}

			if(params.game_uri){
				// Game URI can include parameters such as {activityId}, {simvaResultUri}, {authToken} or {username}
				// so the game can obtain when opened the authorization to send traces, and result
				// or completion status to simva.
				
				this.extra_data.game_uri = params.game_uri;
			}
		}
	}

	static getType(){
		return 'gameplay';
	}

	static getName(){
		return 'Gameplay Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that uses RAGE Analytics and also Minio.';
	}

	static async getUtils(username){
		let autils = await RageAnalyticsActivity.getUtils(username);
		let mutils = await MinioActivity.getUtils(username);

		return {...autils, ...mutils};
	}

	async getDetails(){
		return {
			backup: this.extra_data.config.backup,
			trace_storage: this.extra_data.config.trace_storage,
			realtime: this.extra_data.config.realtime
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

		if(!this.id){
			if(this.extra_data.config.realtime){
				this.extra_data.analytics = await RealtimeActivity.initAnalytics(this.owners[0], this.name);
			}
		}

		return await super.save();
	}

	async remove(){
		if(this.extra_data.config.realtime){
			await RealtimeActivity.cleanAnalytics(this.extra_data.analytics);
		}

		return await super.remove();
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		if(this.extra_data.game_uri){
			return true;
		}

		return false;
	}

	async addParticipants(participants){
		if(this.extra_data.config.realtime){
			this.extra_data.analytics = await RealtimeActivity.addParticipantsToAnalytics(participants, this.extra_data.analytics);
		}

		return await super.addParticipants(participants);
	}

	async removeParticipants(participants){
		if(this.extra_data.config.realtime){
			this.extra_data.analytics = await RealtimeActivity.removeParticipantsFromAnalytics(participants, this.extra_data.analytics);
		}

		return await super.removeParticipants(participants);
	}

	updateMissingTraceElements(participant, trace) {
		const now = new Date();
		if(!trace.id) {
			trace.id = generateStatementId(trace);
		}
		if(!trace.stored) {
			trace.stored = now.toISOString();
		}
		if(!trace.timestamp) {
			trace.timestamp = now.toISOString();
		}
		if(!trace.version) {
			trace.version = "1.0.3";
			//trace.version = "2.0.0";
		}
		if(!trace.authority) {
			trace.authority = {
				homePage: config.external_url,
				name: participant
			};
		}
		return trace;
	}

	sendProgressOrCompletionOfGame(trace, participant) {
		if(trace.object && trace.object.definition && trace.object.definition.type == "https://w3id.org/xapi/seriousgames/activity-types/serious-game") {
			const initializedVerb='http://adlnet.gov/expapi/verbs/initialized';
			const progressedVerb='http://adlnet.gov/expapi/verbs/progressed';
			const completedVerb='http://adlnet.gov/expapi/verbs/completed';
			const resultExtensionProgress='https://w3id.org/xapi/seriousgames/extensions/progress';
			if(trace.verb) {
				switch(trace.verb.id) {
					case initializedVerb:
						logger.info("INITIALIZED GAME");
						const message = {
							type: 'activity_initialized',
							user: participant,
							activityId: this.id,
							message: `Activity ${this.id} has been initialized!`
						};
					
						// Broadcast the message to all clients
						sseSimvaClientManager.sendMessageToClient(this.id, participant, message);
						this.setProgress(participant, 0);
					  break;
					case progressedVerb:
						logger.info("PROGRESSED THROUGH GAME");
						if(trace.result && trace.result.extensions[resultExtensionProgress]) {
							var value = trace.result.extensions[resultExtensionProgress];
							logger.info(value);
							this.setProgress(participant, value);
							const message = {
								type: 'activity_progressed',
								activityId: this.id,
								user: participant,
								val: value,
								message: `Activity ${this.id} has a progressed!`
							};
						
							// Broadcast the message to all clients
							sseSimvaClientManager.sendMessageToClient(this.id, participant, message);
						}
					  break;
					case completedVerb:
						if(trace.result.completion == true) {
							logger.info("COMPLETED GAME");
							this.setCompletion(participant, true);
							const message = {
								type: 'activity_completed',
								activityId: this.id,
								user: participant,
								message: `Activity ${this.id} has been completed!`
							};
						
							// Broadcast the message to all clients
							sseSimvaClientManager.sendMessageToClient(this.id, participant, message);
						}
					  break;
					default: 
						logger.info("OTHER VERB");
				}
			}
		}
	}

	async setStatement(participant, result){
		let toret = 0;
		let response=[];
		try {
			if(Array.isArray(result)){
				if(this.extra_data.config.trace_storage){
					var traces= [];
					for(let traceId = 0; traceId < result.length; traceId++) {
						var trace = result[traceId];
						this.sendProgressOrCompletionOfGame(trace, participant);
						traces.push(this.updateMissingTraceElements(participant, trace));
					}
					response = await TraceStorageActivity.sendTracesToKafka(traces, this.id);
					toret =  { ids: response };
				} else {
					throw { message: 'Trace Storage is not enabled. No xAPI collector.' }
				}
			} else if(!result || typeof result === 'object'){
				if(this.extra_data.config.trace_storage){
					trace = this.updateMissingTraceElements(participant, result);
					this.sendProgressOrCompletionOfGame(trace, participant);
					await TraceStorageActivity.sendTracesToKafka([trace], this.id);
					toret =  { ids: response };
				} else {
					throw { message: 'Trace Storage is not enabled. No xAPI collector.' };
				}
			} else {
				logger.info('Unknown case');
				logger.info(result.result);
				throw { message: 'Unknown case setting the statements' };
			}
		}catch(e){
			logger.error(e);
			throw { message: 'Error while setting the statements' };
		}
		return toret;
	}

	async setResult(participant, result){
		let toret = 0;
		try{
			if(Array.isArray(result)){
 				// If we're receiving an array, we're receiving traces
				if(this.extra_data.config.trace_storage || this.extra_data.config.realtime){
					if(this.extra_data.config.trace_storage){
						var traces= [];
						for(let traceId = 0; traceId < result.length; traceId++) {
							var trace = result[traceId];
							this.sendProgressOrCompletionOfGame(trace, participant);
							traces.push(this.updateMissingTraceElements(participant, trace));
						}
						await TraceStorageActivity.sendTracesToKafka(traces, this.id);
					}
					//if(this.extra_data.config.realtime){
					//	await RealtimeActivity.sendTracesToAnalytics(participant, this.extra_data.analytics, result)
					//}
					toret =  { message: 'Traces Received' };
				}else{
					throw { message: 'Trace Storage or Realtime are not enabled. No xAPI collector.' };
				}
			}else if(!result || typeof result === 'object'){
				// If these conditions are satisfied, we're receiving an start or backup
				if(result && result.result){
					if(this.extra_data.config.backup){
						await super.saveToFile(participant, result.result);
						return { message: 'Results Saved' };
					}else{
						throw { message: 'Backup is not enabled for this activity' };
					}
				} else {
					if(this.extra_data.config.trace_storage || this.extra_data.config.realtime){
						toret = { 
							actor: {
								account: { homePage: config.external_url, name: participant },
								name: participant
							},
							playerId: participant,
							objectId: config.external_url + '/activities/' + this.id,
						}
					} else {
						throw { message: 'Trace Storage or Realtime are not enabled. No xAPI collector.' };
					}
				}
			}else{
				logger.info('Unknown case');
				logger.info(result.result);
				throw { message: 'Unknown case setting the result' };
			}
		}catch(e){
			logger.error(e);
			throw { message: 'Error while setting the result' };
		}

		return toret;
	}

	async getResults(participants, type){
		let results = {};

		/* ########## DISABLED TRACE STORAGE DOWNLOAD ##########
		if(this.extra_data.config.trace_storage && !participants && (!Array.isArray(participants) || participants.length == 0))
		{
			return await GameplayActivity.getTracesFromZip(this.id, this.token, this.res);
		}*/

		/* ########## DISABLED REALTIME ##########
		let analyticsresults = {};
		if(this.extra_data.config.realtime){
			analyticsresults = await RealtimeActivity.getAnalyticsResults(participants, this.extra_data.analytics);
		}*/

		let backupresults = await this.loadBackups(participants);
		participants = Object.keys(backupresults);

		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = null;
			if( (this.extra_data.config.realtime && analyticsresults[participants[i]] !== null) 
				|| (this.extra_data.config.backup && backupresults[participants[i]] !== null) ){
				results[participants[i]] = null;

				/* ########## DISABLED REALTIME ##########
				if(this.extra_data.config.realtime){
					results[participants[i]].realtime = analyticsresults[participants[i]];
				}*/

				if(this.extra_data.config.backup){
					results[participants[i]] = backupresults[participants[i]];
				}
			}
		}

		return results;
	}

	async hasResults(participants, type){
		let results = await this.getResults(participants, type);

		if(participants.length === 0){
			participants = Object.keys(results);
		}
		
		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = (results[participants[i]] !== null);
		}

		return results;
	}

	static async getTemporaryCredentials(minio_endpoint, access_token, ca_file) {
		const data = {
			Action: 'AssumeRoleWithWebIdentity',
			Version: '2011-06-15',
			DurationSeconds: 3600,
			WebIdentityToken: access_token
		};

		try {
			const response = await axios.post(minio_endpoint, new URLSearchParams(data), {
				httpsAgent: new https.Agent((ca_file && ca_file != "") ? {
					ca: fs.readFileSync(ca_file) 
				}:{})
			});

			if (response.status !== 200) {
				logger.info('Problems getting temporary credentials');
				logger.info(response.data);
			} else {
				const parser = new xml2js.Parser({
					explicitArray: false,
					tagNameProcessors: [xml2js.processors.stripPrefix]
				});

				const result = await parser.parseStringPromise(response.data);
				const credentials = result.AssumeRoleWithWebIdentityResponse
					.AssumeRoleWithWebIdentityResult.Credentials;
				return {
					access_key_id: credentials.AccessKeyId,
					secret_access_key: credentials.SecretAccessKey,
					session_token: credentials.SessionToken
				};
			}
		} catch (error) {
			logger.error('Error:', error);
		}
	}

	async setUserToken(token){
		this.token = token;
	}

	async setRes(res){
		this.res = res;
	}

	
	static async getTracesFromZip(activity_id, access_token, res, ca_file = "") {
		var utils = await GameplayActivity.getUtils("");
		var temporaryCredentials = await GameplayActivity.getTemporaryCredentials(utils.minio_url, access_token, ca_file);
	
		const requestBody = {
			"bucketName": `${config.minio.bucket}`,
			"prefix":  `${config.minio.topics_dir}/${config.minio.traces_topic}/`,
			"objects": [`_id=${activity_id}/`]
		};
	
		logger.info('Starting ZIP request...');
	
		try {
			const response = await axios.post(
				utils.minio_url + "minio/zip?token=" + temporaryCredentials.session_token,
				requestBody,
				{
					responseType: 'stream',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
					}
				}
			);
	
			logger.info('ZIP reply received, processing...');
			res.setHeader('Content-Disposition', `attachment; filename="${activity_id}.zip"`);

			let isFirstFile = true;
			const transformStream = new Transform({
				writableObjectMode: true,
				transform(file, encoding, callback) {
					logger.info('Processing file:', file.name);
					let data = file.contents;
					if (isFirstFile) {
						data = "[" + data;
						isFirstFile = false;
					} else {
						data = "," + data;
					}
					this.push(data);
					callback();
				},
				final(callback) {
					this.push("]");
					logger.info('Finalizing the transformation stream...');
					callback();
				}
			});
	
			await pipelineAsync(
				response.data,
				unzipper.Parse(),
				new Transform({
					objectMode: true,
					transform(entry, encoding, callback) {
						if (entry.type === 'File') {
							let contents = '';
							entry.on('data', (chunk) => contents += chunk);
							entry.on('end', () => {
								this.push({ name: entry.path, contents });
								callback();
							});
						} else {
							entry.autodrain();
							callback();
						}
					}
				}),
				transformStream,
				res
			);
	
			logger.info('Pipeline completada con éxito.');
	
		} catch (error) {
			logger.error("Error al procesar el archivo ZIP:", error);
			res.status(500).send({ error: error.message });
		}
	}

	async loadBackups(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let backups = [];

		for (var i = 0; i < participants.length; i++) {
			try {
				backups[participants[i]] = await super.readFromFile(participants[i]);
			}catch(e){
				if(!e.error || !e.error.code || e.error.code != 'ENOENT'){
					logger.error(e);
				}
				backups[participants[i]] = null;
			}
		}

		return backups;
	}

	async checkBackups(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let backups = [];

		for (var i = 0; i < participants.length; i++) {
			try {
				backups[participants[i]] = await super.fileExists(participants[i]);
			}catch(e){
				if(!e.error || !e.error.code || e.error.code != 'ENOENT'){
					logger.error(e);
				}
				backups[participants[i]] = false;
			}
		}

		return backups;
	}

	async setCompletion(participant, status){
		return await super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		let completion = {};

		let basecompletion = await super.getCompletion(participants);
		let analyticscompletion = {};

		if(this.extra_data.config.realtime){
			analyticscompletion = await RealtimeActivity.getAnalyticsCompletion(participants, this.extra_data.analytics);
		}

		participants = Object.keys(basecompletion);

		for (var i = participants.length - 1; i >= 0; i--) {
			if(this.extra_data.config.realtime){
				completion[participants[i]] = analyticscompletion[participants[i]];
			}

			completion[participants[i]] = completion[participants[i]] || basecompletion[participants[i]];
		}

		return completion;
	}

	async target(participants){
		if(this.extra_data.game_uri){
			let targets = {};

			if(participants.length === 0){
				if(this.extra_data && this.extra_data.participants){
					participants = Object.keys(this.extra_data.participants);
				}

				if(participants.length === 0){
					return {};
				}
			}

			var users = {};
			if(this.extra_data.game_uri.indexOf('{authToken}' !== -1)){
				users = await UsersController.getUsers({ username: { '$in': participants } })

				let tmpusers = {};
				for (var i = users.length - 1; i >= 0; i--) {
					tmpusers[users[i].username] = users[i];
				}

				users = tmpusers;
			}

			for (var i = participants.length - 1; i >= 0; i--) {
				let customUri = this.extra_data.game_uri;

				if(this.extra_data.game_uri.indexOf('{authToken}' !== -1)){
					let authToken = await UsersController.generateJWT(users[participants[i]]);
					customUri = customUri.replace('{authToken}', authToken);
				}

				customUri = customUri.replace('{simvaResultUri}', encodeURIComponent(`${config.api.url}/activities/${this.id}`));
				customUri = customUri.replace('{simvaHomePage}', encodeURIComponent(`${config.external_url}`));
				customUri = customUri.replace('{activityId}', this.id);
				customUri = customUri.replace('{username}', participants[i]);

				targets[participants[i]] = customUri;
			}

			return targets;
		}else{
			return false;
		}
	}

	getCodeFromError(error) {
		return error.substr(3, error.indexOf('<<')-3);
	}


	// ##########################################
	// Minio
	// ##########################################
	//static async initializeMinioClient(access_token, ca_file = "") {
	//	var utils = await GameplayActivity.getUtils("");
	//	var temporaryCredentials = await GameplayActivity.getTemporaryCredentials(utils.minio_url, access_token, ca_file);
	//	var minioClient = new Minio.Client({
	//		endPoint: new URL(utils.minio_url).hostname,
	//		useSSL: true,
	//		accessKey: temporaryCredentials.access_key_id,
	//		secretKey: temporaryCredentials.secret_access_key,
	//		sessionToken: temporaryCredentials.session_token
	//	});
	//	return minioClient;
	//}

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
			let time_before_expiration=config.minio.presigned_url_expiration_time;
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

module.exports = GameplayActivity;
