const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');
var MinioActivity = require('./MinioActivity');
var RageAnalyticsActivity = require('./RageAnalyticsActivity');

var RealtimeActivity = new RageAnalyticsActivity({});
var TraceStorageActivity = new RageAnalyticsActivity({});

var UsersController = require('../userscontroller');

var config = require('..//config');

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
			this.extra_data.analytics = await this.removeParticipantsFromAnalytics(participants, this.extra_data.analytics);
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
						await super.setResult(participant, result);
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
			}
		}catch(e){
			console.log(e);
			throw { message: 'Error while setting the result' };
		}

		return toret;
	}

	async getResults(participants){
		let results = {};

		let backupresults = await super.getResults(participants);
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