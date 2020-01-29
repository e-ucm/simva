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
		if(!this.extra_data){
			this.extra_data = { participants: {} };
		}
		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}
		
		for(let p in participants){

			if(!this.extra_data.participants[participants[p]]){
				this.extra_data.participants[participants[p]] = { completion: false };
			}
		}

		return await this.save();
	}

	async removeParticipants(participants){
		for (var i = 0; i < participants.length; i++) {
			delete this.extra_data.participants[participants[i]];
		}

		return await this.save();
	}

	async setResult(participant, result){
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}

		this.extra_data.participants[participant].result = result;

		return await this.save();
	}

	async getResults(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(var p in participants){
				if(this.extra_data.participants[participants[p]] && this.extra_data.participants[participants[p]].result){
					results[participants[p]] = this.extra_data.participants[participants[p]].result;
				}else{
					results[participants[p]] = 'No results';
				}
			}
		}else{
			for(var p in participants){
				results[participants[p]] = 'No results';
			}
		}

		return results;
	}

	async setCompletion(participant, status){
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}

		this.extra_data.participants[participant].completion = status;

		return await this.save();
	}

	async getCompletion(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(var p in participants){
				if(this.extra_data.participants[participants[p]] && this.extra_data.participants[participants[p]].completion){
					results[participants[p]] = this.extra_data.participants[participants[p]].completion;
				}else{
					results[participants[p]] = false;
				}
			}
		}else{
			for(var p in participants){
				results[participants[p]] = false;
			}
		}

		return results;
	}

	open(res, participant){
		//nothing to do here
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Activity;