const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('..//config');

let timeout = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var a2config = {
	options: {
		url: config.a2.url + '/api',
		headers: {
			'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
			'host': config.a2.host,
			'connection': 'keep-alive',
			'content-type': 'application/json',
			'accept': 'application/json'
		}
	},
	user: config.a2.adminUser,
	password: config.a2.adminPassword
}


let a2controller = require('./analytics/a2');

a2controller.setOptions(a2config.options);
a2controller.setUser(a2config.user, a2config.password);

let AnalyticsBackendController = require('./analytics/backend');

var analyticsBackendConfig = {
	options: {
		url: config.analyticsbackend.url,
		headers: {
			'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
			'host': config.analyticsbackend.host,
			'connection': 'keep-alive',
			'content-type': 'application/json',
			'accept': 'application/json'
		}
	}
}

let TrackerManager = require('./analytics/trackermanager');
let trackerManager = new TrackerManager();


class RageAnalyticsActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		this.backendController = new AnalyticsBackendController();
		this.backendController.Options = analyticsBackendConfig.options;

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
		return {
			dashboard_url: config.a2.external_url + '/api/proxy/kibana/app/kibana#/dashboard/dashboard_',
			dashboard_query: '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                   'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))'
		};
	}

	async getDetails(){
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

		if(!this.id){
			let analytics = await this.initAnalytics(this.owners[0], this.name);
			this.extra_data.game = analytics.game;
			this.extra_data.manager = analytics.manager;
			this.extra_data.class = analytics.class;
			this.extra_data.activity = analytics.activity;
		}

		return await super.save();
	}

	async initAnalytics(username, activityname){
		let analytics = {};

		analytics.participants = {};

		analytics.manager = await this.createManager(username);

		let loggeduser = await this.login(username, username);

		this.backendController.AuthToken = loggeduser.token;
		analytics.game = await this.backendController.addGame(activityname);
		analytics.game.versions = await this.backendController.getVersions(analytics.game._id);

		analytics.class = await this.backendController.addClass(activityname);

		let gameId = analytics.game._id;
		let versionId = analytics.game.versions[0]._id;
		let classId = analytics.class._id;

		analytics.activity = await this.backendController.addActivity(activityname, gameId, versionId, classId);

		//RAGE Analytics backend needs a little bit of extra time to init the activity.
		await timeout(2000);

		await this.backendController.startActivity(analytics.activity._id);

		return analytics;
	}

	async remove(){
		// TODO:
		// check if the participants can be deleted from A2

		await this.cleanAnalytics(this.extra_data);

		return await super.remove();
	}

	async cleanAnalytics(analytics){
		let loggeduser = await this.login(analytics.manager.username, analytics.manager.username);
		this.backendController.AuthToken = loggeduser.token;

		await this.backendController.endActivity(analytics.activity._id);
		await this.backendController.deleteActivity(analytics.activity._id);
		await this.backendController.deleteClass(analytics.class._id);
		await this.backendController.deleteGame(analytics.game._id);

		return true;
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		this.extra_data = await this.addParticipantsToAnalytics(participants, this.extra_data);

		return await this.save();
	}

	async addParticipantsToAnalytics(participants, analytics){
		for(let i = 0; i < participants.length; i++){
			if(!analytics.participants[participants[i]]){
				analytics.participants[participants[i]] = null;
			}
		}

		let a2participants = await this.addParticipantsToA2(participants);

		if(a2participants.data){
			if(a2participants.data.length !== participants.length){
				throw { message: 'The number of participants added is different form the ones created.'};
			}else{
				for (var i = 0; i < a2participants.data.length; i++) {
					analytics.participants[a2participants.data[i].username] = a2participants.data[i];
				}
			}
		}

		let loggeduser = await this.login(analytics.manager.username, analytics.manager.username);
		this.backendController.AuthToken = loggeduser.token;
		await this.backendController.addUsersToClass(analytics.class._id, participants);

		return analytics;
	}

	async createManager(username){
		return new Promise((resolve, reject) => {

			let user = {
				username: username,
				password: username,
				email: username + '@simva.test',
				role: ['teacher', 'developer'],
				prefix: "gleaner"
			};

			async.waterfall([
				a2controller.auth,
				a2controller.signup(user),
				a2controller.getUsers(username)
			], function (error, result) {
				if(error){
					reject(error);
				}else{
					if(result && result.data && result.data.length >0){
						resolve(result.data[0]);
					}else{
						reject({ message: 'Unable to create or find the manager user'});
					}
				}
			});
		});
	}

	async login(user, password){
		return new Promise((resolve, reject) => {
			a2controller.login(user, password, function(error, result){
				if(error){
					reject(error);
				}else{
					resolve(result);
				}
			})
		});
	}

	async addParticipantsToA2(participants){
		return new Promise((resolve, reject) => {
			try{
				async.waterfall([
					a2controller.auth,
					a2controller.signupMassive(participants),
					a2controller.getUsers(participants)
				], function (error, result) {
					if(error){
						reject(error);
					}else{
						resolve(result);
					}
				});
			}catch(e){
				reject(e);
			}
		})
	}

	async removeParticipants(participants){
		this.extra_data = await this.removeParticipantsFromAnalytics(participants, this.extra_data);
		
		return await this.save();
	}

	async removeParticipantsFromAnalytics(participants, analytics){
		for (var i = 0; i < participants.length; i++) {
			delete analytics.participants[participants[i]];
		}

		// TODO:
		// check if the participants can be deleted from A2
		
		let loggeduser = await this.login(analytics.manager.username, analytics.manager.username);
		this.backendController.AuthToken = loggeduser.token;
		await this.backendController.removeUsersFromClass(analytics.class._id, participants);

		return analytics;
	}

	async setResult(participant, result){
		let toret = 0;
		try{
			if(Array.isArray(result)){
				// If we're receiving an array, we're receiving traces
				toret = this.sendTracesToAnalytics(participant, this.extra_data, result)
			}else if(!result || typeof result === 'object'){
				// If these conditions are satisfied, we're receiving an start
				toret = { 
					actor: {
						account: { homePage: config.external_url, username: participant },
						name: participant
					},
					playerId: participant,
					objectId: config.external_url  + '/activities/' + this.id,
				}
			}
		}catch(e){
			throw e;
		}

		return toret;
	}

	async sendTracesToAnalytics(participant, analytics, traces){
		if(!trackerManager.hasTracker(analytics.activity._id, participant)){
			await trackerManager.InitTracker(analytics.activity, participant, participant);
		}

		trackerManager.AddTrace(analytics.activity._id, participant, traces);
		return { message: 'Traces Added' };
	}

	async getResults(participants){
		return await this.getAnalyticsResults(participants, this.extra_data);
	}

	async getAnalyticsResults(participants, analytics){
		let results = {};

		if(participants.length === 0){
			if(analytics && analytics.participants){
				participants = Object.keys(analytics.participants);
			}

			if(participants.length === 0){
				return {};
			}
		}

		try{
			for (var i = participants.length - 1; i >= 0; i--) {
				results[participants[i]] = null;
			}

			let loggeduser = await this.login(analytics.manager.username, analytics.manager.username);

			this.backendController.AuthToken = loggeduser.token;
			let analyzed_results = await this.backendController.getActivityResults(analytics.activity._id);

			for (var i = analyzed_results.length - 1; i >= 0; i--) {
				if(results[analyzed_results[i].name] !== undefined){
					results[analyzed_results[i].name] = analyzed_results[i];
				}
			}

			return results;
		}catch(e){
			console.log(e);
			throw { message: 'Error getting results', error: e };
		}
	}

	async setCompletion(participant, status){
		return false;
	}

	async getCompletion(participants){
		return await this.getAnalyticsCompletion(participants, this.extra_data);
	}

	async getAnalyticsCompletion(participants, analytics){
		if(participants.length === 0){
			if(analytics && analytics.participants){
				participants = Object.keys(analytics.participants);
			}

			if(participants.length === 0){
				return {};
			}
		}
		
		let completion = {};
		let results = await this.getAnalyticsResults(participants, analytics);

		for (var i = participants.length - 1; i >= 0; i--) {
			if(results[participants[i]] !== null
				&& results[participants[i]]
				&& results[participants[i]].completed
				&& results[participants[i]].completed['serious-game']){
				completion[participants[i]] = true;
			}else{
				completion[participants[i]] = false;
			}
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

module.exports = RageAnalyticsActivity;