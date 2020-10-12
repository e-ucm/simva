const ServerError = require('../error');
var mongoose = require('mongoose');
let fs = require('fs');
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
		
		for(let i = 0; i < participants.length; i++){
			if(!this.extra_data.participants[participants[i]]){
				this.extra_data.participants[participants[i]] = { completion: false };
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

		this.extra_data.participants[participant].result = result.result;
		
		if(result.tofile === true){
			await this.saveToFile(participant + '.result', result.result);
		}
		return { result: await this.save() };
	}

	async saveToFile(filename, content){
		return new Promise((resolve, reject) => {

			let activity = this;

			try{
				let savefile = function(){
					let fullname = "storage/" + activity._id + '/' + filename;
					fs.writeFile(fullname, content, function(error) {
						if(error) {
							reject({ message: 'Unable to save file: "' + fullname + '".', error: error})
						}else{
							resolve();
						}
					});
				}

				let checkSubfolder = function(){
					fs.stat('storage/' + activity._id, function(error, stats){
						if(error){
							console.log('Folder does not exist');
							fs.mkdir('storage/' + activity._id, function(error){
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

				fs.stat('storage', function(error, stats){
					if(error){
						fs.mkdir('storage', function(error){
							if(error){
								reject({ message: 'Unable to create the base directory.', error: error })
							}else{
								savefile();
							}
						})
					}else{
						checkSubfolder();
					}
				})
			}catch(e){
				console.log(e);
			}
		});
	}

	async getResults(participants){
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
};

// ##########################################
// Module exports
// ##########################################

module.exports = Activity;