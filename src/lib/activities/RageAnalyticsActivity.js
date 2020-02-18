const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('..//config');

var a2config = {
	options: {
		url: config.a2.url,
		headers: {
			'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
			'host': config.a2.host,
			'connection': 'keep-alive',
			'content-type': 'application/json'
		}
	},
	user: config.a2.adminUser,
	password: config.a2.adminPassword
}


let a2controller = require('./analytics/a2');

a2controller.setOptions(a2config.options);
a2controller.setUser(a2config.user, a2config.password);


class RageAnalyticsActivity extends Activity {

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
		return 'rageanalytics';
	}

	static getName(){
		return 'RAGE Analytics Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that uses RAGE Analytics.';
	}

	static async getUtils(username){
		return {}
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

	async delete(){
		try{
			// TODO:
			// check if the participants can be deleted from A2

			return await super.delete();
		}catch(e){
			return false;
		}
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		for(let p in participants){
			if(!this.extra_data.participants[participants[p]]){
				this.extra_data.participants[participants[p]] = null;
			}
		}

		var a2participants = await this.addParticipantsToSurvey(participants);

		for(let p in a2participants){
			this.extra_data.participants[a2participants[p].username] = a2participants[p];
		}

		return await this.save();
	}

	async addParticipantsToA2(participants){
		return new Promise((resolve, reject) => {
			if(this.extra_data && this.extra_data.surveyId){
				try{
					async.waterfall([
						a2controller.auth,
						a2controller.signupMassive(codes),
					], function (err, result) {
						if(result.errorCount > 0){
							console.log(result);
						}

						callback(err, codes);
					});
				}catch(e){
					reject(e);
				}
			}else{
				resolve();
			}
		})
	}

	async removeParticipants(participants){
		let toremove = [];
		for (var i = 0; i < participants.length; i++) {
			toremove.push(this.extra_data.participants[participants[i]].tid);
			delete this.extra_data.participants[participants[i]];
		}

		// TODO:
		// check if the participants can be deleted from A2
		
		return await this.save();
	}

	async setResult(participant, result){
		//Add tracker control
		return false;
	}

	async getResults(participants){
		return new Promise((resolve, reject) => {
			// TODO:
			// Obtain result traces and results file
			// from backend filtered by user
		});
	}

	async setCompletion(participant, status){
		return false;
	}

	async getCompletion(participants){
		// TODO
		// Calculate the completion based on the traces

		return results;
	}

	target(participants){
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

module.exports = RageAnalyticsActivity;