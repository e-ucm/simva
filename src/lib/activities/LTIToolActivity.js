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
	client_id: config.LTI.platform.client_id,
	client_password: config.LTI.platform.key,
	claims_url: config.external_url + "/activities/",
	auth_url: config.sso.realmUrl + "/protocol/openid-connect/token",
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
		let tools = await LtiController.getLtiTools();

		return {
			tools: tools
		};
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
		let targets = {};

		if(participants.length === 0){
			if(this.extra_data && this.extra_data.participants){
				participants = Object.keys(this.extra_data.participants);
			}

			if(participants.length === 0){
				return {};
			}
		}

		let tool = await LtiController.getLtiTool(this.extra_data.tool);

		let lti_message_hint = await LtiController.generateJWT({
			activity: this.id
		});

		for (var i = 0; i < participants.length; i++) {
			let login_hint = await LtiController.generateJWT({
				participant: participants[i]
			});

			let deployment = 'D001';

			let url = tool.login_uri
				+ '?login_hint=' + login_hint
				+ '&lti_message_hint=' + lti_message_hint
				+ '&client_id=' + tool.client_id
				+ '&lti_deployment_id=' + deployment
				+ '&iss=' + config.sso.realmUrl
				+ '&target_link_uri=' + tool.url;
			
			targets[participants[i]] = url;
		}

		return targets;
	}

	async getLtiContext(){
		let context = {};

		if(!this.extra_data.context_id){
			let study = super.getStudy()

			let label = 'ACT' + this.id;
			let title = this.name;
			if(study){
				label = 'STD' + study._id + label;
				title = study.name + ' - ' + title;
			}

			context = await LtiController.addLtiContext({
				org: config.external_url + '/',
				type: [ "http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering" ],
				label: label,
				title: title,
				sourcedId: 'activity:' + this.id,
				history: 'none'
			})

			this.extra_data.context_id = context._id;

			await super.save();
		}else{
			context = await LtiController.getLtiContext(this.extra_data.context_id);
		}

		return context;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = LTIToolActivity;