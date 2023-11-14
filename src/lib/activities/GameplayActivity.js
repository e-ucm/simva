const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');
var Minio = require('minio');

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const https = require('https');

var Activity = require('./activity');
var MinioActivity = require('./MinioActivity');
var RageAnalyticsActivity = require('./RageAnalyticsActivity');

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
				// Game URI can include parameters such as {activityId}, {authToken} or {username}
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

		return await super.addParticipants(participants);
	}

	async setResult(participant, result){
		let toret = 0;

		try{
			if(Array.isArray(result)){
				// If we're receiving an array, we're receiving traces
				if(this.extra_data.config.trace_storage || this.extra_data.config.realtime){
					if(this.extra_data.config.trace_storage){
						await TraceStorageActivity.sendTracesToKafka(result, this.id);
					}

					if(this.extra_data.config.realtime){
						await RealtimeActivity.sendTracesToAnalytics(participant, this.extra_data.analytics, result)
					}
					
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
				}else{
					if(this.extra_data.config.trace_storage || this.extra_data.config.realtime){
						toret = { 
							actor: {
								account: { homePage: config.external_url, username: participant },
								name: participant
							},
							playerId: participant,
							objectId: config.external_url + '/activities/' + this.id,
						}
					}else{
						throw { message: 'Trace Storage or Realtime are not enabled. No xAPI collector.' };
					}
				}
			}else{
				console.log('Unknown case');
				console.log(result.result);
				throw { message: 'Unknown case setting the result' };
			}
		}catch(e){
			console.log(e);
			throw { message: 'Error while setting the result' };
		}

		return toret;
	}

	async getResults(participants){
		let results = {};

		if(this.extra_data.config.trace_storage && (!Array.isArray(participants) || participants.length == 0))
		{
				return await getTracesFromZip(this.id, this.token);
		}


		let backupresults = await this.loadBackups(participants);
		let analyticsresults = {};

		if(this.extra_data.config.realtime){
			analyticsresults = await RealtimeActivity.getAnalyticsResults(participants, this.extra_data.analytics);
		}

		participants = Object.keys(backupresults);

		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = null;
			if( (this.extra_data.config.realtime && analyticsresults[participants[i]] !== null) 
				|| (this.extra_data.config.backup && backupresults[participants[i]] !== null) ){
				results[participants[i]] = {};

				if(this.extra_data.config.realtime){
					results[participants[i]].realtime = analyticsresults[participants[i]];
				}

				if(this.extra_data.config.backup){
					results[participants[i]].backup = backupresults[participants[i]];
				}
			}
		}

		return results;
	}

	
	async getMinioObjects(minioClient, bucket, prefix){
		var objectsList = await this.listMinioObjects(minioClient, bucket, prefix);
		var objectPromises = [];
		for(var obj in objectsList){
			objectPromises.push(this.getObject(minioClient, bucket, obj.name));
		}

		return Promise.all(objectPromises)
			.then(contents => {
				return "[" + contents.concat(",") + "]";
			})
	}

	async getObject(minioClient, bucket, name){
		return new Promise((resolve, reject) => {
			var chunks = [];
			const stream = minioClient.getObject(bucket, name, function (e, dataStream) {
				stream.on('data', function(chunk) {
					chunks.push(chunk);
				});
		
				stream.on('error', function(err) {
					reject(err);
				});
		
				stream.on('end', function() {
					const buffer = Buffer.concat(chunks);
					const string = buffer.toString('utf8');
					resolve(string);
				});
			});
		});
	}

	async listMinioObjects(minioClient, bucket, prefix){
		return new Promise((resolve, reject) => {
			const objectsList = [];
			const stream =  minioClient.listObjects(bucket, prefix);
	  
			stream.on('data', function(obj) {
				objectsList.push(obj);
			});
	  
			stream.on('error', function(err) {
				reject(err);
			});
	  
			stream.on('end', function() {
				resolve(objectsList);
		    });
		});
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
				console.log('Problems getting temporary credentials');
				console.log(response.data);
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
			console.error('Error:', error);
		}
	}

	async setUserToken(token){
		this.token = token;
	}

	
	static async getTracesFromZip(activity_id, access_token, ca_file = "") {
		var utils = await GameplayActivity.getUtils("");
		var temporaryCredentials = await GameplayActivity.getTemporaryCredentials(utils.minio_url, access_token, ca_file);

		// Preparar el body de la petición
		const requestBody = {
			"bucketName": "traces",
			"prefix": "kafka-topics/traces/",
			"objects": [`_id=${activity_id}/`]
		};

		try {
			// Hacer una petición POST para descargar el archivo zip
			const response = await axios.post(
				utils.minio_url + "minio/zip?token=" + temporaryCredentials.session_token,
				requestBody, 
				{
					responseType: 'arraybuffer'
				}
			);

			// Descargar el archivo zip en memoria
			const zipData = response.data;

			// Abrir el archivo zip
			const zip = await JSZip.loadAsync(zipData);
			let combinedData = "";

			// Combinar todos los archivos del interior utilizando un separador de ","
			for (const filename of Object.keys(zip.files)) {
				const fileData = await zip.files[filename].async('string');
				combinedData += fileData + ",";
			}

			// Retornar el resultado con "[" y "]" alrededor
			return "[" + combinedData.slice(0, -1) + "]";  // Elimina la última coma
		} catch (error) {
			console.error("Error al procesar el archivo ZIP:", error);
			throw error;
		}
	}

	static async initializeMinioClient(access_token, ca_file = "") {
		var utils = await GameplayActivity.getUtils("");
		var temporaryCredentials = await GameplayActivity.getTemporaryCredentials(utils.minio_url, access_token, ca_file);
		var minioClient = new Minio.Client({
			endPoint: new URL(utils.minio_url).hostname,
			useSSL: true,
			accessKey: temporaryCredentials.access_key_id,
			secretKey: temporaryCredentials.secret_access_key,
			sessionToken: temporaryCredentials.session_token
		});
		return minioClient;
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
					console.log(e);
				}
				backups[participants[i]] = null;
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
};

// ##########################################
// Module exports
// ##########################################

module.exports = GameplayActivity;
