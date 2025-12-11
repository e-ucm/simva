const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('../config');
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

var LRS= require("./LRS.js");

var LRSManager = new LRS();

let controller = require('./limesurvey/controller');
var sendSimvaTaskToKafka = require('../utils/SimvaTaskToKafka');

controller.setOptions(limeconfig.options);
controller.setUser(limeconfig.user,limeconfig.password);


class LimeSurveyActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);
		
		if(!this.extra_data){
			this.extra_data = {};
		}
		if(!this.extra_data.participants){
			this.extra_data.participants = [];
		}

		if(params.survey) {
			let rawsurvey = params.survey;
          	params.rawsurvey = btoa(rawsurvey);
		}
		if(params.rawsurvey){
			this.rawsurvey = params.rawsurvey;
		}else if(params.copysurvey){
			this.copysurvey = params.copysurvey;
		}
		this.username = params.username;
		if(params.language){
			this.extra_data.language = params.language;
		}
	}

	async export(complete) {
		let activity = super.export();
		if(complete) {
			try {
				// Await the result of the survey export
				const surveyResult = await controller.exportSurvey(this.extra_data.surveyId);
				activity.survey = atob(surveyResult);
				logger.info("LSS Export successful");
			} catch (error) {
				logger.error("LSS Export failed:", error);
			}
		} else {
			activity.copysurvey = this.extra_data.surveyId;
		}
		activity.language = this.extra_data.language;
		return activity;
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


	async getCompleteActivity(objectUser) { 
		var activityResultTask={
			task: 'getResults',
			params: '',
			object: 'Activity',
			objectEvent: 'true',
			objectLoad: 'true',
			objectUser: objectUser,
			objectId: this._id
		};
		await sendSimvaTaskToKafka([activityResultTask]);
		var activitySurveyLanguagesTask={
			task: 'getSurveyLanguages',
			params: '',
			object: 'Activity',
			objectEvent: 'true',
			objectLoad: 'true',
			objectUser: objectUser,
			objectId: this._id
		};
		await sendSimvaTaskToKafka([activitySurveyLanguagesTask]);
		return super.getCompleteActivity();
	}

	static async getUtils(username){
		return new Promise((resolve, reject) => {
			async.waterfall([
				controller.online,
				controller.auth,
				controller.getSurveysFromUser(username)
			], function (err, surveys) {
				if(err){
					reject(err);
				}else{
					let utils = {
						url: config.limesurvey.external_url,
						surveys: surveys
					};
					if(config.limesurvey.useNewVersion) {
						utils.editurl= config.limesurvey.external_url + "/surveyAdministration/view?surveyid=" ;
						utils.newurl= config.limesurvey.external_url + "/surveyAdministration/newSurvey" ;
					} else {
						utils.editurl= config.limesurvey.external_url + "/admin/survey/sa/view/surveyid/" ;
						utils.newurl= config.limesurvey.external_url + "/admin/survey/sa/newsurvey" ;
					}

					resolve(utils);
				}
			});
		});
	}

	async getDetails(){
		return {
			url:`${config.limesurvey.external_url}/${this.extra_data.surveyId}`,
			lang: `${this.extra_data.language}`,
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
		if(!this.extra_data) {
			this.extra_data = {};
		}
		if(typeof params.copysurvey !== 'undefined') {
			this.copysurvey = params.copysurvey;
			if(this.extra_data && this.extra_data.participants) {
				this.participants=Object.keys(this.extra_data.participants);
			}
		}
		if(typeof params.username !== 'undefined') {
			this.username = params.username;
		}
		if(typeof params.language !== 'undefined') {
			this.extra_data.language = params.language;
		}
	}
	
	async save(){
		if(!this.extra_data){
			this.extra_data = {};
			this.extra_data.participants={};
		}
		if(this.copysurvey){
			let copysurvey=this.copysurvey;
			delete this.copysurvey;
			let participants=Object.keys(this.extra_data.participants);
			if(participants.length > 0) {
				await this.removeParticipants(participants);
			}
			this.extra_data.surveyId = await this.createSurveyById(copysurvey);
			if(this.participants && this.participants.length > 0) {
				await this.addParticipants(this.participants);
			}
			delete this.participants;
		}else if(this.rawsurvey){
			this.extra_data.surveyId = await this.createSurveyByFile();	
			delete this.rawsurvey;
		}
		if(!this.extra_data.language) {
			this.extra_data.language = (await this.getSurveyLanguages()).default;
		}
		var surveyid = this.extra_data.surveyId;
		if(this.extra_data.lrsset !== surveyid) {
			var lrsendpoint=config.api.url + "/activities/" + this.id;
			await controller.setActivityLRSEndpointPromise(surveyid, lrsendpoint);
			this.extra_data.lrsset = surveyid;
		}
		if(this.username) {
			try {
				await this.setSurveyOwnerFromUsername(this.username);
			} catch(e) {
				logger.info(e);
			}
			delete this.username;
		}

		return await super.save();
	}

	async remove(){
		try{

			await this.deleteSurvey();
			return await super.remove();
		}catch(e){
			return false;
		}
	}

	async createSurveyById(surveyId){
		return new Promise((resolve, reject) => {
			if(surveyId){
				try{
					async.waterfall([
						controller.online,
						controller.auth,
						controller.clone(surveyId, this.name),
					], function (err, result) {
						if(err){
							reject(err);
						}else{
							resolve(result);
						}
					});
				}catch(exception){
					logger.error(exception);
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
						controller.create(this.rawsurvey)
					], function (err, result) {
						if(err){
							reject(err);
						}else{
							resolve(result);
						}
					});
				}catch(exception){
					logger.error(exception);
				}
			}
		})
	}

	async setSurveyOwnerFromUsername(username) {
		if(config.limesurvey.useNewVersion) {
		} else {
			let isOwner=await this.isUserOwnerOfSurvey(username);
			if(!isOwner) {
				var userid = await this.getUserIdByUserName(username);
				await this.setSurveyOwner(userid);
				this.extra_data.surveyOwner = username;
				this.save();
			}
		}
	}

	async getUserIdByUserName(username){
		return new Promise((resolve, reject) => {
			try{
				async.waterfall([
					controller.getUserIdByUserName(username)
				], function (err, result) {
					if(err){
						reject(err);
					}else{
						resolve(result);
					}

					resolve(result);
				});
			}catch(exception){
				logger.error(exception);
			}
		})
	}

	
	async isUserOwnerOfSurvey(username){
		return new Promise((resolve, reject) => {
			try{
				async.waterfall([
					controller.auth,
					controller.isUserOwnerOfSurvey(this.extra_data.surveyId, username)
				], function (err, result) {
					if(err){
						reject(err);
					}else{
						resolve(result.isOwner);
					}

					resolve(result);
				});
			}catch(exception){
				logger.error(exception);
			}
		})
	}

	async setSurveyOwner(userid){
		return new Promise((resolve, reject) => {
			try{
				async.waterfall([
					controller.auth,
					controller.setSurveyOwner(this.extra_data.surveyId, userid)
				], function (err, result) {
					if(err){
						reject(err);
					}else{
						resolve(result);
					}

					resolve(result);
				});
			}catch(exception){
				logger.error(exception);
			}
		})
	}

	async getSurveyLanguages(){
		return new Promise((resolve, reject) => {
			try{
				async.waterfall([
					controller.online,
					controller.auth,
					controller.getSurveyLanguages(this.extra_data.surveyId)
				], function (err, result) {
					if(err){
						reject(err);
					}else{
						resolve(result);
					}

					resolve(result);
				});
			}catch(exception){
				logger.error(exception);
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
					logger.error(exception);
				}
			}else{
				logger.info(this.extra_data);
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
		for(let i = 0; i < participants.length; i++){
			if(!this.extra_data.participants[participants[i]]){
				this.extra_data.participants[participants[i]] = null;
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

	async sendProgressOrCompletionOfActivity(trace, participant, activityType) {
        if(trace.object && trace.object.definition && trace.object.definition.type == "http://adlnet.gov/expapi/activities/assessment") {
			var username;
			if(trace.actor) {
				if(trace.actor.account && trace.actor.account.name) {
					username=trace.actor.account.name;
				} else {
					username=trace.actor.name;
				}
			}
			if(username == null) {
				username=participant;
			}
            const initializedVerb='http://adlnet.gov/expapi/verbs/initialized';
            const progressedVerb='http://adlnet.gov/expapi/verbs/progressed';
            const completedVerb='http://adlnet.gov/expapi/verbs/completed';
			var sendSimvaTaskToKafka = require("../utils/SimvaTaskToKafka.js");
            if(trace.verb) {
                switch(trace.verb.id) {
                    case initializedVerb:
                        logger.info(`INITIALIZED ACTIVITY ${activityType}`);
                        var taskMessage = {
							task: 'setProgress',
							params: 'user,progress',
							object: 'Activity',
							objectLoad:true,
							objectId: this.id,
							user: username,
							progress: 0
						};
						sendSimvaTaskToKafka([taskMessage]);
                      break;
                    case progressedVerb:
                        logger.info(`PROGRESSED THROW ACTIVITY  ${activityType}`);
                        var value = null;
                        if(trace.result && trace.result.score && trace.result.score.scaled) {
                            value = trace.result.score.scaled;
                        }
                        logger.info(value);
                        var taskMessage = {
								task: 'setProgress',
								params: 'user,progress',
								object: 'Activity',
								objectLoad:true,
								objectId: this.id,
								user: username,
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
								objectLoad:true,
								objectId: this.id,
								user: username,
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

	async setStatement(participant, result){
		let toret = 0;
		try {
			for(let traceId = 0; traceId < result.length; traceId++) {
				var trace = result[traceId];
				await this.sendProgressOrCompletionOfActivity(trace, participant, "limesurvey");
			}
			toret = await LRSManager.setStatement(this.id, participant, result);
			//if(this.extra_data.config.trace_storage){
			//	
			//} else {
			//	throw { message: 'Trace Storage is not enabled. No xAPI collector.' }
			//}
		}catch(e){
			logger.error(e);
			throw { message: 'Error while setting the statements' };
		}
		return toret;
	}

	async setResult(participant, result){
		return false;
	}

	async getResults(participants, type){
		return new Promise((resolve, reject) => {
			if(type == "undefined") {
				type = "full";
			}
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
					controller.getResponses(s.extra_data.surveyId, s.extra_data.language, participants, type),
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
					controller.online,
					controller.auth,
					controller.getResponseByToken(s.extra_data.surveyId,s.extra_data.language,participants[0], type)
				], function (err, response) {
					if(err){
						reject(err);
					}else{
						let result = {};
						result[participants[0]] = response;
						resolve(result)
					}
				});
			}
		});
	}

	async hasResults(participants, type){
		let results = await this.getResults(participants);

		if(participants.length === 0){
			participants = Object.keys(results);
		}

		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = (results[participants[i]] !== null);
		}
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
			results[participants[i]] = (results[participants[i]] !== null
				&& (results[participants[i]].submitdate !== null && results[participants[i]].submitdate !== undefined ));
		}

		return results;
	}

	async target(participants){
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
				targets[participants[i]] = config.limesurvey.external_url + this.extra_data.surveyId + '?token=' + participants[i];
				if(this.extra_data.language) {
					targets[participants[i]]+='&lang=' + this.extra_data.language;
				}
			}
		} else {
			return false;
		}

		return targets
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = LimeSurveyActivity;