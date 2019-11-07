const ServerError = require('../error');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

class Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		this.extra_data = {};
		this.owners = [];

		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
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
		return 'activity';
	}

	set params(params){
		for(var p in activityschema.properties){
			if(params[p]){
				this[p] = params[p]
			}
		}

		if(params['_id']){
			this._id = params['_id'];
		}
	}


	set id(id){
		if(!ObjectId.isValid(id)){
			throw {message: 'not a valid objectId'};
		}else{
			this._id = id;
		}
	}

	get id(){
		return this._id;
	}

	async load(){
		var res = await mongoose.model('activity').find({_id: this.id});

		if(res.length > 0) {
			for(var k in res[0]){
				this[k] = res[0][k];
			}
			return true;
		}

		return false;
	}

	async save(){
		var params = {};

		for(var p in activityschema.properties){
			params[p] = this[p];
		}

		if(this.id){
			params['_id'] = this.id;
		}

		if(params._id){
			var result = await mongoose.model('activity').updateOne({ _id: this.id }, params);
			if(result.ok !== result.n){
				throw { message: 'Error saving the activity' };
			}
		}else{
			var activity = new mongoose.model('activity')(params);
			await activity.save();
			this.id = activity._id;
		}
		

		return true;
	}

	async delete(){
		var res = await mongoose.model('activity').deleteOne({_id: this.id});

		return true;
	}

	// ##########################################
	// Activity-related functions
	// ##########################################

	canBeOpened(){
		return false;
	}

	async addParticipants(participants){
		// Nothing to do by default
	}

	async removeParticipants(participants){
		// Nothing to do by default
	}

	async getResults(participants){
		// by default, if there is extra data and some completion data,
		// this will return an array of completion statuses for the
		// participants.
		
		results = {};
		if(this.extra_data && this.extra_data.completion){
			for(var p in participants){
				if(this.extra_data.completion[participants[p].id]){
					results[participants[p].id] = this.extra_data.completion[participants[p].id];
				}else{
					results[participants[p].id] = false;
				}
			}
		}else{
			for(var p in participants){
				results[participants[p].id] = false;
			}
		}

		return results;
	}

	async setCompletion(participant, status){
		if(!ObjectId.isValid(participant)){
			return false;
		}

		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.completion){
			this.extra_data.completion = {};
		}

		this.extra_data.completion[participant] = status;
	}

	async getCompletion(participant){
		if(this.extra_data
			&& this.extra_data.completion
			&& this.extra_data.completion[participant]){
			return this.extra_data.completion[participant];
		}else{
			return false;
		}
	}

	open(res, participant){
		//nothing to do here
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Activity;