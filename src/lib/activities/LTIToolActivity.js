const ServerError = require('../error');

let config = require('../config');
let mongoose = require('mongoose');
let fs = require('fs');
let ObjectId = mongoose.Types.ObjectId;
let app = require('../utils/appmanager').getApp();
let LtiController = require('../lticontroller');

const validator = require('../utils/validator');

var activityschema = validator.getSchema('#/components/schemas/activity');

var Activity = require('./activity');

/*
	THIS PART IS FOR THE LTI TOOL

	let ltitoolclient = 

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
			appRoute: '/activities/:',
			loginRoute: '/login',

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
	*/


let lticonfig = {
	client_id: 'lti-platform',
	client_password: 'e30c49da-5d2b-401e-919c-0d483161dac2',
	claims_url: "https://simva.e-ucm.es/activities/",
	auth_url: "https://4b8ab6ba9bba.ngrok.io/auth/realms/master/protocol/openid-connect/token",
}

class LTIToolActivity extends Activity {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);

		if(params.tool){
			this.extra_data.tool = params.tool;
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
		return 'ltitool';
	}

	static getName(){
		return 'LTI Tool Activity';
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

	async load(){
		return super.load();
	}

	async save(){
		let tool = await LtiController.getLtiTool(this.extra_data.tool);

		if(!tool){
			throw { message: 'Lti tool not found!' };
		}

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

	async target(participant){
		let tool = await LtiController.getLtiTool(this.extra_data.tool);

		let login_hint = await LtiController.generateJWT({
			participant: participant
		});

		let lti_message_hint = await LtiController.generateJWT({
			activity: this.id
		});

		let deployment = 'D001';

		let url = tool.login_url
			+ '?login_hint=' + login_hint
			+ '&lti_message_hint=' + lti_message_hint
			+ '&client_id=' + tool.client_id
			+ '&lti_deployment_id=' + deployment
			+ '&iss=' + config.sso.realmUrl
			+ '&target_link_uri=' + tool.url;

		return url;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = LTIToolActivity;