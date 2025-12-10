const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');
let fs = require('fs');
var ObjectId = mongoose.Types.ObjectId;
var config = require('./config');
const { v4: uuidv4} = require('uuid');
var sendSimvaTaskToKafka = require('./utils/SimvaTaskToKafka');
const validator = require('./utils/validator');
var studyschema = validator.getSchema('#/components/schemas/study');
var { isoToDuration } = require("./utils/date");
class Study {
    constructor(params) {
        this.extra_data = {};
		this.owners = [];
		if(this.extra_data.registrationid == null) {
			this.extra_data.registrationid = {};
		}
		if(this.extra_data.timestamp == null) {
			this.extra_data.timestamp = {};
		}
		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
    }

	toObject(){
		var params = {};
		for(var p in studyschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	set params(params){
		for(var p in studyschema.properties){
			if(params[p]){
				this[p] = params[p];
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

	async getStudyUsersParticipants() {
		var GroupsController = require('./groupscontroller');
		var groups = await GroupsController.getGroups({"_id" : {"$in" : study.groups}});
		let participants = groups.map(g => {return g.participants; }).flat();
		participants = participants.filter((p,i) => participants.indexOf(p) === i);
		var UsersController = require('./userscontroller');
		participants= await UsersController.getUsers({"username" : {"$in" : participants}});
		return participants;
	}

 	async getStudyGroups() {
		var groups = await GroupsController.getGroups({"_id" : {"$in" : this.groups}});
		return groups;
	}


 	async getStudyAllocator() {
		var AllocatorsController = require('./allocatorscontroller');
		var allocator = await AllocatorsController.getAllocator(this.allocator);
		return allocator;
	}

	async getStudyTests(objectUser) {
		this.tests.forEach(async element =>  {
			var testTask={
				task: 'getStudyTest',
				params: 'objectId,objectUser',
				object: 'Study',
				objectEvent: 'true',
				objectLoad: 'true',
				objectUser:objectUser,
				objectId: element
			};
			logger.debug(JSON.stringify(testTask));
			await sendSimvaTaskToKafka([testTask]);
		});
	}

	async getStudyTest(testId, objectUser) {
		if(this.tests.includes(testId)) {
			var TestsController = require("./testscontroller");
			let test = await TestsController.getTest(testId);
			test.activities.forEach(async element => {
				var activityTask={
					task: 'getActivity',
					params: 'objectId',
					object: 'Activity',
					objectEvent: 'true',
					objectLoad: 'true',
					objectUser: objectUser,
					objectId: element
				};
				logger.debug(JSON.stringify(activityTask));
				await sendSimvaTaskToKafka([activityTask]);
			});
			return test;
		}
	}

	async save(){
		var params = {};

		for(var p in studyschema.properties){
			params[p] = this[p];
		}

		if(this.id){
			params['_id'] = this.id;
		}

		if(params._id){
			var result = await mongoose.model('study').updateOne({ _id: this.id }, params);
			if(result.ok !== result.n){
				throw { message: 'Error saving the study' };
			}
		}else{
			var study = new mongoose.model('study')(params);
			await study.save();
			this.id = study._id;
		}

		return true;
	}

	async remove(){
		var res = await mongoose.model('study').deleteOne({_id: this.id});

		return true;
	}

	async sendXAPITraceForStudy(user,verb, timestamp, resultScore=null) {
		let registrationid = this.extra_data.registrationid[user];
		let startedTimestamp = this.extra_data.timestamp[user];
		var result;
		switch(verb) {
			case "Initialized":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/initialized",
					"display": {
						"en-US": "initialized"
					}
				};
				if(registrationid) {
					logger.info("Already Initialized");
					return;
				} else {
					registrationid=uuidv4();
					this.extra_data.registrationid[user] = registrationid;
					await this.save();
				}
				this.extra_data.timestamp[user]=timestamp;
				break;
			case "Terminated":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/terminated",
					"display": {
						"en-US": "terminated"
					}
				};
				result= {
					duration: isoToDuration(startedTimestamp, timestamp),
				};
			case "Progressed":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/progressed",
					"display": {
						"en-US": "progressed"
					}
				};
				result= {
					score: {
						scaled: resultScore
					}
				};
			case "Resumed":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/resumed",
					"display": {
						"en-US": "resumed"
					}
				};
				this.extra_data.timestamp[user]=timestamp;
			case "Suspended":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/suspended",
					"display": {
						"en-US": "suspended"
					}
				};
				result= {
					duration: isoToDuration(startedTimestamp, timestamp),
				};
			case "Completed":
				verbXAPI = {
					"id":"http://adlnet.gov/expapi/verbs/completed",
					"display": {
						"en-US": "completed"
					}
				};
			default:
				logger.info(verb);
				return;
		}
		var statement = {
			actor: {
				account: {
					homePage: config.external_url,
					name: user
				}
			},
			verb: verbXAPI,
			object: {
				id: `${config.external_url}/studies/${this._id}`,
				definition: {
					name: this.name,
					description: `An activity ${this.name} of study ${this._id}`,
					"type": "http://adlnet.gov/expapi/activities/lesson"
				}
			},
			"context": {
				"contextActivities": {
					"category": [{
						"id":"https://w3id.org/xapi/scorm",
						"definition": {
   							"type":"http://adlnet.gov/expapi/activities/profile"
  						}
					}]
				},
				"registration": registrationid
			},
			"timestamp": timestamp
		};
		logger.info(JSON.stringify(statement));
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Study;