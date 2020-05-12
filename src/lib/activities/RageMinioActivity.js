const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var MinioActivity = require('./MinioActivity');
var RageAnalyticsActivity = require('./RageAnalyticsActivity');

var AnalyticsActivity = new RageAnalyticsActivity({});

var config = require('..//config');

class RageMinioActivity extends MinioActivity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(!this.extra_data.participants){
			this.extra_data.participants = [];
			this.extra_data.analytics = {};
		}
	}

	static getType(){
		return 'rageminio';
	}

	static getName(){
		return 'RAGE Analytics + Minio Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that uses RAGE Analytics and also Minio.';
	}

	static async getUtils(username){
		let autils = await RageAnalyticsActivity.getUtils(username);
		let mutils = await super.getUtils(username);

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
			this.extra_data.analytics = await AnalyticsActivity.initAnalytics(this.owners[0], this.name);
		}

		return await super.save();
	}

	async remove(){
		await AnalyticsActivity.cleanAnalytics(this.extra_data.analytics);

		return await super.remove();
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		this.extra_data.analytics = await AnalyticsActivity.addParticipantsToAnalytics(participants, this.extra_data.analytics);

		return await super.addParticipants(participants);
	}

	async removeParticipants(participants){
		this.extra_data.analytics = await this.removeParticipantsFromAnalytics(participants, this.extra_data.analytics);
		
		return await super.addParticipants(participants);
	}

	async setResult(participant, result){
		let toret = 0;

		try{
			if(Array.isArray(result)){
				// If we're receiving an array, we're receiving traces

				await super.sendTracesToKafka(result, this.id);
				await AnalyticsActivity.sendTracesToAnalytics(participant, this.extra_data.analytics, result)
				toret =  { message: 'Traces Received' };
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

	async getResults(participants){
		let results = {};
		let analyticsresults = await AnalyticsActivity.getAnalyticsResults(participants, this.extra_data.analytics);
		let minioresults = await super.getResults(participants);

		participants = Object.keys(analyticsresults);

		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = null;
			if(analyticsresults[participants[i]] !== null || minioresults[participants[i]] !== null){
				results[participants[i]] = {};

				results[participants[i]].analytics = analyticsresults[participants[i]];
				results[participants[i]].minio = minioresults[participants[i]];
			}
		}

		return results;
	}

	async setCompletion(participant, status){
		return await super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		let completion = {};
		let analyticscompletion = await AnalyticsActivity.getAnalyticsCompletion(participants, this.extra_data.analytics);
		let miniocompletion = await super.getCompletion(participants);

		participants = Object.keys(analyticscompletion);

		for (var i = participants.length - 1; i >= 0; i--) {
			completion[participants[i]] = analyticscompletion[participants[i]] || miniocompletion[participants[i]];
		}

		return completion;
	}

	async target(participants){
		// As this activity is not openable, there are no targets
		return false;
	}

	getCodeFromError(error) {
		return error.substr(3, error.indexOf('<<')-3);
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = RageMinioActivity;