const ServerError = require('../error');

let config = require('../config');
let mongoose = require('mongoose');
let fs = require('fs');
let ObjectId = mongoose.Types.ObjectId;
let app = require('../utils/appmanager').getApp();

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

var GameplayActivity = require('./GameplayActivity');

class ImsPackageActivity extends GameplayActivity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(params.tool){
			this.extra_data.file_name = params.file_name;
		}
	}

	toObject(){
		var params = {};
		for(var p in activityschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	static getType(){
		return 'imspackage';
	}

	static getName(){
		return 'IMS Package Activity';
	}

	static getDescription(){
		return 'A gameplay activity that allows the user to upload a IMS package as game.';
	}

	static async getUtils(username){
		return await super.getUtils(username)
	}

	async getDetails(){
		return {};
	}

	async load(){
		return super.load();
	}

	async save(){
		return await super.save();
	}

	async remove(){
		return super.remove();
	}

	// ##########################################
	// Activity-related functions
	// ##########################################

	canBeOpened(){
		return true;
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

	async getResults(participants){
		return await super.getResults(participants);
	}

	async setCompletion(participant, status){
		return await super.setCompletion(participant, status);
	}

	async getCompletion(participants){
		return await super.getCompletion(participants);
	}

	async target(participants){
		return await super.target(participants);
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = ImsPackageActivity;