	const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const https = require('https');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');
const unzipper = require('unzipper');
const pipelineAsync = promisify(pipeline);

var sendSimvaEventsToKafka = require('../utils/SimvaEventsToKafka.js');
var sendSimvaTaskToKafka = require('../utils/SimvaTaskToKafka.js');
var Activity = require('./activity');
var MinioActivity = require('./MinioActivity');
var LRS= require("./LRS.js");

var LRSManager = new LRS();

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
					backup: false,
					scorm_xapi_by_game:false,
				};
			}

			if(params.trace_storage && params.trace_storage === true){
				this.extra_data.config.trace_storage = true;
			}

			if(params.scorm_xapi_by_game && params.scorm_xapi_by_game === true){
				this.extra_data.config.scorm_xapi_by_game = true;
			}

			if(params.backup && params.backup === true){
				this.extra_data.config.backup = true;
			}

			if(!this.extra_data.participants){
				this.extra_data.participants = [];
			}

			if(params.game_uri){
				// Game URI can include parameters such as {activityId}, {simvaResultUri}, {authToken} or {username}
				// so the game can obtain when opened the authorization to send traces, and result
				// or completion status to simva.
				
				this.extra_data.game_uri = params.game_uri;
			}
		}
	}
	
	async export(complete) {
		let activity = super.export();
		activity.trace_storage = this.extra_data.config.trace_storage;
		activity.backup = this.extra_data.config.backup;
		activity.game_uri = this.extra_data.game_uri;
		activity.scorm_xapi_by_game = this.extra_data.scorm_xapi_by_game;
		return activity;
	}

	static getType(){
		return 'gameplay';
	}

	static getName(){
		return 'Gameplay Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that uses Minio.';
	}

	static async getUtils(username){
		let mutils = await MinioActivity.getUtils(username);

		return {...mutils};
	}

	async getDetails(){
		return {
			backup: this.extra_data.config.backup,
			trace_storage: this.extra_data.config.trace_storage,
			scorm_xapi_by_game: this.extra_data.config.scorm_xapi_by_game,
		};
	}

	set params(params){
		super.params = params;

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
	}

	patch(params) {
		super.patch(params);
		if(typeof params.trace_storage !==  'undefined') {
			if(typeof params.trace_storage == "string") {
				params.trace_storage = params.trace_storage === "true";
			}
			this.extra_data.config.trace_storage = params.trace_storage;
		}
		if(typeof params.backup !== 'undefined') {
			if(typeof params.backup == "string") {
				params.backup = params.backup === "true";
			}
			this.extra_data.config.backup = params.backup;
		}
		if(typeof params.scorm_xapi_by_game !== 'undefined') {
			if(typeof params.scorm_xapi_by_game == "string") {
				params.scorm_xapi_by_game = params.scorm_xapi_by_game === "true";
			}
			this.extra_data.config.scorm_xapi_by_game = params.scorm_xapi_by_game;
		}
		if(typeof params.game_uri !== 'undefined') {
			this.extra_data.game_uri = params.game_uri;
		}
	}

	async save(){
		if(!this.extra_data){
			this.extra_data = {};
		}
		if(typeof this.extra_data.config.trace_storage !==  'undefined') {
			if(typeof this.extra_data.config.trace_storage == "string") {
				this.extra_data.config.trace_storage = this.extra_data.config.trace_storage === "true";
			}
		}
		if(typeof this.extra_data.config.scorm_xapi_by_game !==  'undefined') {
			if(typeof this.extra_data.config.scorm_xapi_by_game == "string") {
				this.extra_data.config.scorm_xapi_by_game = this.extra_data.config.scorm_xapi_by_game === "true";
			}
		}
		if(typeof this.extra_data.config.backup !== 'undefined') {
			if(typeof this.extra_data.config.backup == "string") {
				this.extra_data.config.backup = this.extra_data.config.backup === "true";
			}
		}

		return await super.save();
	}

	async remove(){
		return await super.remove();
	}


	async sendXAPITraceForActivity(user, verb, timeStamp, resultScore,reasonExtension) {
		if(!this.extra_data.config.scorm_xapi_by_game) {
			return super.sendXAPITraceForActivity(user, verb, timeStamp, resultScore,reasonExtension);
		}
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

		return await super.addParticipants(participants);
	}

	async removeParticipants(participants){

		return await super.removeParticipants(participants);
	}

	async setStatement(participant, result){
		let toret = 0;
		try {
			if(this.extra_data.config.trace_storage){
				for(let traceId = 0; traceId < result.length; traceId++) {
					var trace = result[traceId];
					await this.sendProgressOrCompletionOfActivity(trace, participant, "limesurvey");
				}
				toret = await LRSManager.setStatement(this.id, participant, result);
			} else {
				throw { message: 'Trace Storage is not enabled. No xAPI collector.' }
			}
		}catch(e){
			logger.error(e);
			throw { message: 'Error while setting the statements' };
		}
		return toret;
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
                        logger.info(`INITIALIZED ACTIVITY ${activityType}`);
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
                        logger.info(`PROGRESSED THROW ACTIVITY  ${activityType}`);
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
							logger.info(`COMPLETED ACTIVITY ${activityType}`);
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
				if(this.extra_data.config.trace_storage){
					for(let traceId = 0; traceId < result.length; traceId++) {
						var trace = result[traceId];
						await this.sendProgressOrCompletionOfActivity(trace, participant, "limesurvey");
					}
					toret = await LRSManager.setStatement(this.id, participant, result);
				}else{
					throw { message: 'Trace Storage or Realtime are not enabled. No xAPI collector.'};
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
					if(this.extra_data.config.trace_storage){
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

		let backupresults = await this.loadBackups(participants);
		participants = Object.keys(backupresults);

		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = null;
			if( (this.extra_data.config.backup && backupresults[participants[i]] !== null) ){
				results[participants[i]] = null;

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
	
			logger.info('Pipeline completed successfully.');
	
		} catch (error) {
			logger.error("Error processesing ZIP:" + error);
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

		participants = Object.keys(basecompletion);

		for (var i = participants.length - 1; i >= 0; i--) {

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
				let username=participants[i];
				let usertoken=username;
				let user=await UsersController.getUsers({"username":username});
				if(user.length > 0 && user[0].role == "student" && user[0].isToken == "true") {
					usertoken=user[0].token;
				}
				if(this.extra_data.game_uri.indexOf('?' !== -1)){
					customUri+="?";
					customUri+="result_uri=";
					customUri+=encodeURIComponent(`${config.api.url}/activities/${this.id}`);
					customUri+="&backup_uri=";
					customUri+=encodeURIComponent(`${config.api.url}/activities/${this.id}/result`);
					customUri+="&backup_type=XAPI";
					customUri+="&actor_homepage=";
					customUri+=encodeURIComponent(`${config.external_url}`);
					customUri+="&actor_user=";
					customUri+=username;
					customUri+="&sso_token_endpoint=";
					customUri+=encodeURIComponent(`${config.sso.tokenUrl}`);
					customUri+="&sso_client_id=simva-plugin";
					customUri+="&sso_login_hint=";
					customUri+=this.study;
					customUri+="&sso_username=";
					customUri+=usertoken;
					customUri+="&sso_grant_type=password";
					//customUri+="&sso_scope=offline_access";
					customUri+="&batch_length=200";
					customUri+="&batch_timeout=5min";
					customUri+="&max_retry_delay=30min";
					//customUri+="&debug=true";
				} else {
					if(this.extra_data.game_uri.indexOf('{authToken}' !== -1)){
						let authToken = await UsersController.generateJWT(users[participants[i]]);
						customUri = customUri.replace('{authToken}', authToken);
					}
					customUri = customUri.replace('{simvaResultBackupUri}', encodeURIComponent(`${config.api.url}/activities/${this.id}/backup`)); //OK
					customUri = customUri.replace('{simvaResultUri}', encodeURIComponent(`${config.api.url}/activities/${this.id}`)); //OK
					customUri = customUri.replace('{simvaHomePage}', encodeURIComponent(`${config.external_url}`)); //OK
					customUri = customUri.replace('{tokenEndpoint}', encodeURIComponent(`${config.sso.tokenUrl}`)); //OK
					customUri = customUri.replace('{userToken}', usertoken); //OK
					customUri = customUri.replace('{activityId}', this.id); //OK
					customUri = customUri.replace('{studyId}', this.study); //OK
					customUri = customUri.replace('{username}', username); //OK
				}
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
};

// ##########################################
// Module exports
// ##########################################

module.exports = GameplayActivity;
