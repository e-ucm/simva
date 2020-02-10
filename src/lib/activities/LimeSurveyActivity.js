const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('..//config');

var limeconfig = {
	options: {
		url: config.limesurvey.url + '/index.php/admin/remotecontrol',
		method: "POST",
		headers: {
			'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
	    	'host': config.limesurvey.host,
	    	'path': '/index.php/admin/remotecontrol',
	    	'connection': 'keep-alive',
	    	'content-type': 'application/json'
	  	}
	},
  	user: config.limesurvey.adminUser,
  	password: config.limesurvey.adminPassword
}


let controller = require('./limesurvey/controller');

controller.setOptions(limeconfig.options);
controller.setUser(limeconfig.user,limeconfig.password);


class LimeSurveyActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(!this.extra_data.participants){
			this.extra_data.participants = [];
		}

		if(params.rawsurvey){
			this.rawsurvey = params.rawsurvey;
		}else if(params.copysurvey){
			this.copysurvey = params.copysurvey;
		}
	}

	static getType(){
		return 'limesurvey';
	}

	static getName(){
		return 'LimeSurvey Activity';
	}

	static getDescription(){
		return 'A survey-based activity that uses LimeSurvey as service.';
	}

	static async getUtils(){
		// TODO
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

		if(this.copysurvey){
			this.extra_data.surveyId = await this.createSurveyById();
			delete this.copysurvey;
		}else if(this.rawsurvey){
			this.extra_data.surveyId = await this.createSurveyByFile();
			delete this.rawsurvey;
		}

		return await super.save();
	}

	async delete(){
		try{

			await this.deleteSurvey();
			return await super.delete();
		}catch(e){
			return false;
		}
	}

	async createSurveyById(){
		return new Promise((resolve, reject) => {
			if(this.copysurvey){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.clone(this.copysurvey, this.name),
					], function (err, result) {
						
						if(err){
							reject(err);
						}else{
							resolve(result);
						}

						resolve(result);
					});
				}catch(exception){
					console.log(exception);
				}
			}
		})
	}

	async createSurveyByFile(){
		return new Promise((resolve, reject) => {
			if(this.rawsurvey){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.create(this.rawsurvey),
					], function (err, result) {
						
						if(err){
							reject(err);
						}else{
							resolve(result);
						}

						resolve(result);
					});
				}catch(exception){
					console.log(exception);
				}
			}
		})
	}

	async deleteSurvey(){
		return new Promise((resolve, reject) => {
			if(this.extra_data && this.extra_data.surveyId){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.remove(this.extra_data.surveyId),
					], function (err, result) {
						if(err){
							reject(err);
						}else{
							resolve(result);
						}

						resolve(result);
					});
				}catch(exception){
					console.log(exception);
				}
			}else{
				console.log(this.extra_data);
				resolve(null);
			}
		})
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		return true;
	}

	async addParticipants(participants){
		for(let p in participants){
			if(!this.extra_data.participants[participants[p]]){
				this.extra_data.participants[participants[p]] = null;
			}
		}

		var lsparticipants = await this.addParticipantsToSurvey(participants);

		for(let p in lsparticipants){
			this.extra_data.participants[lsparticipants[p].token] = lsparticipants[p];
		}

		return await this.save();
	}

	async addParticipantsToSurvey(participants){
		return new Promise((resolve, reject) => {
			if(this.extra_data && this.extra_data.surveyId){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.addParticipants(participants, this.extra_data.surveyId)
					], function (err, result) {
						if(err){
							return reject(err);
						}

						resolve(result);
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

		await this.removeParticipantsFromSurvey(toremove);
		return await this.save();
	}

	async removeParticipantsFromSurvey(participants){
		return new Promise((resolve, reject) => {
			if(this.extra_data && this.extra_data.surveyId){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.delParticipants(participants, this.extra_data.surveyId)
					], function (err, result) {
						if(!err){
							resolve();
						}

						reject(err);
					});
				}catch(e){
					reject(e);
				}
			}else{
				resolve();
			}
		})
	}

	async setResult(participant, result){
		return false;
	}

	async getResults(participants){
		return new Promise((resolve, reject) => {
			let list = {};
			let s = this;

			if(participants.length === 0){
				if(this.extra_data && this.extra_data.participants){
					participants = Object.keys(this.extra_data.participants);
				}

				if(participants.length === 0){
					resolve({});
					return;
				}
			}

			if(participants.length > 1){
				async.waterfall([
					controller.online,
					controller.auth,
					controller.getResponses(s.extra_data.surveyId, participants),
				], function (err, responses) {
					if(err){
						reject(err);
					}else{
						let result = {};
						for (var i = 0; i < participants.length; i++) {
							if(responses[participants[i]]){
								result[participants[i]] = responses[participants[i]];
							}else{
								result[participants[i]] = null;
							}
						}
						resolve(result);
					}
				});
			}else{
				async.waterfall([
					lsController.online,
					lsController.auth,
					lsController.getResponseByToken(s.extra_data.surveyId,participants[0],rid)
				], function (err, response) {
					if(err){
						reject(err);
					}else{
						result = {};
						result[participants[0]] = response;
						resolve(result)
					}
				});
			}
		});
	}

	async setCompletion(participant, status){
		return false;
	}

	async getCompletion(participants){
		let results = await this.getResults(participants);

		if(participants.length === 0){
			if(this.extra_data && this.extra_data.participants){
				participants = Object.keys(this.extra_data.participants);
			}

			if(participants.length === 0){
				return {};
			}
		}

		for (let i = 0; i < participants.length; i++) {
			results[participants[i]] = (results[participants[i]] !== null && results[participants[i]].submitdate !== null);
		}

		return results;
	}

	target(participants){
		let targets = {};

		if(participants.length === 0){
			if(this.extra_data && this.extra_data.participants){
				participants = Object.keys(this.extra_data.participants);
			}

			if(participants.length === 0){
				return {};
			}
		}

		if(this.extra_data && this.extra_data.surveyId){
			for (let i = 0; i < participants.length; i++) {
				targets[participants[i]] = config.limesurvey.url + '/' + this.extra_data.surveyId + '?token=' + participants[i];
			}
		}else{
			return false;
		}

		return targets
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = LimeSurveyActivity;