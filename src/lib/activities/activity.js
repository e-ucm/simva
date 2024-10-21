const logger = require('../logger');
const ServerError = require('../error');
var mongoose = require('mongoose');
let fs = require('fs');
var ObjectId = mongoose.Types.ObjectId;

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

var config = require('../config');

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

	static getName(){
		return 'Default Activity';
	}

	static getDescription(){
		return 'A basic activity with completion state and a place to save results.';
	}

	static async getUtils(username){
		return {};
	}

	async getDetails(){
		return {};
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

	patch(params) {
		if(typeof params.name !== 'undefined') {
			this.name = params.name;
		}
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

	async remove(){
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
		logger.debug("Before adding participants : " + JSON.stringify(this));

		for(let i = 0; i < participants.length; i++){
			if(!this.extra_data.participants[participants[i]]){
				this.extra_data.participants[participants[i]] = { completion: false };
			}
		}
		logger.debug("After adding participants : " + JSON.stringify(this));
		return await this.save();
	}

	async removeParticipants(participants){
		logger.debug("Before delete participants : " + JSON.stringify(this));
		for (var i = 0; i < participants.length; i++) {
			delete this.extra_data.participants[participants[i]];
		}
		logger.debug("Before delete participants : " + JSON.stringify(this));
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

		this.extra_data.participants[participant].result = result.result;

		let toret = { result: await this.save() };
		
		if(result.tofile === true){
			await this.saveToFile(participant + '.result', result.result);
		}

		return toret;

	}
	async saveToFile(filename, content){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let savefile = function(){
					let fullname = config.storage.path + activity._id + '/' + filename;
					fs.writeFile(fullname, content, function(error) {
						if(error) {
							reject({ message: 'Unable to save file: "' + fullname + '".', error: error})
						}else{
							resolve();
						}
					});
				}

				let checkSubfolder = function(){
					fs.stat(config.storage.path + activity._id, function(error, stats){
						if(error){
							logger.info('Folder does not exist');
							fs.mkdir(config.storage.path + activity._id, function(error){
								if(error){
									reject({ message: 'Unable to create the subdirectory.', error: error })
								}else{
									savefile();
								}
							})
						}else{
							savefile();
						}
					})
				}

				fs.stat(config.storage.path, function(error, stats){
					if(error){
						fs.mkdir(config.storage.path, function(error){
							if(error){
								reject({ message: 'Unable to create the base directory.', error: error })
							}else{
								checkSubfolder();
							}
						})
					}else{
						checkSubfolder();
					}
				})
			}catch(e){
				logger.error(e);
				reject({ message: 'error saving to file', error: e });
			}
		});
	}

	async readFromFile(filename){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let fullname = config.storage.path + activity._id + '/' + filename;

				fs.readFile(fullname, 'utf8', function(error, result) {
					if(error) {
						reject({ message: 'Unable to read file: "' + fullname + '".', error: error})
					}else{
						resolve(result);
					}
				});
			}catch(e){
				logger.error(e);
				reject({ message: 'Error reading file', error: e });
			}
		});
	}

	async fileExists(filename){
		return new Promise((resolve, reject) => {
			let activity = this;

			try{
				let fullname = config.storage.path + activity._id + '/' + filename;

				fs.stat(fullname, 'utf8', function(error, result) {
					if (err == null) {
						resolve(true);
					} else if (error.code === 'ENOENT') {
						resolve(false);
					} else {
						logger.error(error);
						reject({message: 'Unexpected error', error: error});
					}
				});
			}catch(e){
				logger.error(e);
				reject({ message: 'Error reading file', error: e });
			}
		});
	}

	async getResults(participants, type){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].result){
					results[participants[i]] = this.extra_data.participants[participants[i]].result;
				}else{
					results[participants[i]] = null;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = null;
			}
		}

		return results;
	}

	async hasResults(participants, type){
		let results = await this.getResults(participants);

		if(participants.length === 0){
			participants = Object.keys(results);
		}
		
		for (var i = participants.length - 1; i >= 0; i--) {
			results[participants[i]] = (results[participants[i]] !== null);
		}

		return results;
	}

	async getProgress(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].progress){
					results[participants[i]] = this.extra_data.participants[participants[i]].progress;
				}else{
					results[participants[i]] = 0;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = 0;
			}
		}

		return results;
	}

	async setProgress(participant, progress){
		if(!this.extra_data){
			this.extra_data = {}
		}

		if(!this.extra_data.participants){
			this.extra_data.participants = {};
		}

		if(!this.extra_data.participants[participant]){
			this.extra_data.participants[participant] = {}
		}
		if(progress <= 1) {
			this.extra_data.participants[participant].progress = progress;
		}
		return await this.save();
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
		this.extra_data.participants[participant].progress = 1;

		return await this.save();
	}

	async getCompletion(participants){
		if(!participants || participants.length == 0){
			participants = Object.keys(this.extra_data.participants);
		}

		let results = {};
		if(this.extra_data && this.extra_data.participants){
			for(let i = 0; i < participants.length; i++){
				if(this.extra_data.participants[participants[i]] && this.extra_data.participants[participants[i]].completion){
					results[participants[i]] = this.extra_data.participants[participants[i]].completion;
				}else{
					results[participants[i]] = false;
				}
			}
		}else{
			for(let i = 0; i < participants.length; i++){
				results[participants[i]] = false;
			}
		}

		return results;
	}

	async target(participant){
		return false;
	}

	open(res, participant){
		return false;
	}

	async getStudy(){
		let res = null;

		let tests = await mongoose.model('test').find({ activities:  this._id });


		if(tests.length > 0){
			let studies = await mongoose.model('study').find({ tests:  tests[0]._id });

			res = studies[0];
		}

		return res;
	}

	export() {
		var activity = {};
		activity.name = this.name;
		activity.type = this.type;
		activity.extra_data = this.extra_data;
		delete activity.extra_data;
		delete activity._id;
		delete activity.id;
		return activity;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Activity;