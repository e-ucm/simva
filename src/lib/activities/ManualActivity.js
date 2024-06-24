const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
var async = require('async');

var Activity = require('./activity');

var UsersController = require('../userscontroller');

var config = require('../config');

class ManualActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(!this.id){
			if(params.uri){
				this.extra_data.uri = params.uri;
			}

			if(params.user_managed){
				this.extra_data.user_managed = true;
			}else{
				this.extra_data.user_managed = false;
			}
		}
	}

	static getType(){
		return 'manual';
	}

	static getName(){
		return 'Manual Activity';
	}

	static getDescription(){
		return 'An activity that does not communicate with Simva and have to be managed manually.';
	}

	static async getUtils(username){
		return {};
	}

	async getDetails(){
		return {
			user_managed: this.extra_data.user_managed
		};
	}

	set params(params){
		super.params = params;

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
	}

	async save(){
		return await super.save();
	}

	async remove(){
		return await super.remove();
	}

	// ##########################################
	// Activity-related functions
	// ##########################################
	
	canBeOpened(){
		if(this.extra_data.uri){
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

	async setResult(participant, result){
		return await super.setResult(participant, result);
	}

	async getResults(participants, type){
		return await super.getResults(participants, type);
	}

	async hasResults(participants, type){
		return await super.hasResults(participants, type);
	}

	async setCompletion(participant, status){
		return await super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		return await super.getCompletion(participants);
	}

	async target(participants){
		if(this.extra_data.uri){
			let targets = {};

			if(participants.length === 0){
				if(this.extra_data && this.extra_data.participants){
					participants = Object.keys(this.extra_data.participants);
				}

				if(participants.length === 0){
					return {};
				}
			}

			for (var i = participants.length - 1; i >= 0; i--) {
				let customUri = this.extra_data.uri;

				customUri = customUri.replace('{activityId}', this.id);
				customUri = customUri.replace('{username}', participants[i]);

				targets[participants[i]] = customUri;
			}

			return targets;
		}else{
			return false;
		}
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = ManualActivity;