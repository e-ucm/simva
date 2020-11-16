const ServerError = require('../error');
const lti = require('ltijs').Provider;

let config = require('../config');
let mongoose = require('mongoose');
let fs = require('fs');
let ObjectId = mongoose.Types.ObjectId;
let app = require('../utils/appmanager').getApp();

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

lti.setup(
	config.LTI.platform.key,
	{
		url: config.LTI.platform.mongo.url,
		connection: {
			user: config.LTI.platform.mongo.user,
			pass: config.LTI.platform.mongo.password
		}
	},
	{
		/*appRoute: '/activities/:',
		loginRoute: '/login',*/

		cookies: {
			secure: true,
			sameSite: 'None'
		},
		devMode: true
	}
)

lti.onConnect((token, req, res) => {
  console.log(token)
  return res.send('It\'s alive!')
})

await lti.deploy({ serverless: true });
app.use('/lti', lti.app)

setup()


class LTIPlatformActivity {

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
		return 'ltiplatform';
	}

	static getName(){
		return 'LTI Platform Activity';
	}

	static getDescription(){
		return 'An activity that allows the user to include a LTI tool as resource.';
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
		return true;
	}

	async addParticipants(participants){
		return null;
	}

	async removeParticipants(participants){
		return null;
	}

	async setResult(participant, result){
		return null;
	}

	async getResults(participants){
		return null;
	}

	async setCompletion(participant, status){
		return null;
	}

	async getCompletion(participants){
		return null;
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