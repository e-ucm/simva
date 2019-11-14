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
			console.log(this.copysurvey);
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
							reject(error);
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
				console.log('asd');
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.remove(this.extra_data.surveyId),
					], function (err, result) {
						if(err){
							reject(error);
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

	async getResults(participants){
		// by default, if there is extra data and some completion data,
		// this will return an array of completion statuses for the
		// participants.
		
		for(var p in participants){
			results[participants[p].id] = false;
		}

		return results;
	}

	async setCompletion(participant, status){
		// Limesurvey completion is managed externally
		return false;
	}

	async getCompletion(participant){
		// TODO
		return false;
	}

	open(res, participant){
		// should we send also res?
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = LimeSurveyActivity;