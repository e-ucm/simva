const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var config = require('..//config');

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


class RageAnalyticsActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		this.backendController = new AnalyticsBackendController();

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

		if(!this.id){
			let user = {
				username: this.owners[0],
				password: this.owners[0],
				email: this.owners[0] + '@simva.test',
				role: ['teacher', 'developer'],
				prefix: "gleaner"
			};

			this.extra_data.manager = await this.createManager(user);

			let loggeduser = await this.login(user.username, user.password);

			this.backendController.AuthToken = loggeduser.token;
			this.extra_data.game = await this.backendController.addGame(this.name);
			this.extra_data.game.versions = await this.backendController.getVersions(this.extra_data.game._id);
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

		let a2participants = await this.addParticipantsToA2(participants);

		if(a2participants.data){
			if(a2participants.data.length !== participants.length){
				throw { message: 'The number of participants added is different form the ones created.'};
			}else{
				for (var i = 0; i < a2participants.data.length; i++) {
					this.extra_data.participants[a2participants.data[i].username] = a2participants.data[i];
				}
			}
		}

		return await this.save();
	}

	async createManager(user){
		return new Promise((resolve, reject) => {
			async.waterfall([
				a2controller.auth,
				a2controller.signup(user),
				a2controller.getUsers(this.owners[0])
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