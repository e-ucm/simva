const ServerError = require('./error');
var mongoose = require('mongoose');

var ActivitiesController = {};
var Activity = require('./activities/activity');
var LimeSurveyActivity = require('./activities/LimeSurveyActivity');
var RageAnalyticsActivity = require('./activities/RageAnalyticsActivity');

var types = [Activity, LimeSurveyActivity, RageAnalyticsActivity];

ActivitiesController.getStudy = async (id) => {
	let res = null;

	let tests = await mongoose.model('test').find({ activities:  id });


	if(tests.length > 0){
		let studies = await mongoose.model('study').find({ tests:  tests[0]._id });

		res = studies[0];
	}

	return res;
}

ActivitiesController.getActivities = async (params) => {
	let res = await mongoose.model('activity').find(params);

	return res;
};

ActivitiesController.getActivity = async (id) => {
	let res = await mongoose.model('activity').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

ActivitiesController.loadActivity = async (id) => {
	let activity = await ActivitiesController.getActivity(id);
	
	if(!activity){
		throw {message: 'Unable to load activity.'}; 
	}
	return ActivitiesController.castToClass(activity);
}

ActivitiesController.addActivity = async (params, files) => {
	for (var i = 0; i < types.length; i++) {
		if(types[i].getType() == params.type){
			if(files){
				params.rawsurvey = new Buffer(files.survey, '7bit').toString('base64');
			}

			var activity = new types[i](params);

			var result = await activity.save();

			return activity.toObject();
		}
	}

	throw {message: 'Unknown activity type'}; 
}

ActivitiesController.updateActivity = async (id, activity) => {
	

	throw {message: 'Unknown activity type'}; 
}

ActivitiesController.deleteActivity = async (id) => {
	let activity = await ActivitiesController.loadActivity(id);

	if(activity) {
		return await activity.remove();
	}else{
		return null;
	}
};

ActivitiesController.addActivityToTest = async (id, activity) => {
	
}

ActivitiesController.removeActivityFromTest = async (activity, test) => {
	
}

ActivitiesController.addParticipants = async (id, participant) => {

}

ActivitiesController.castToClass = function(activity){
	for (let i = 0; i < types.length; i++) {
		if(types[i].getType() == activity.type){
			let castedActivity = new types[i](activity);
			return castedActivity;
		}
	}
	return null;
}

ActivitiesController.getActivityTypes = async (user) => {
	let activitytypes = [];

	for (let i = 0; i < types.length; i++) {
		let activitytype = {};
		activitytype.type = types[i].getType();
		activitytype.name = types[i].getName();
		activitytype.description = types[i].getDescription();
		activitytype.utils = await types[i].getUtils(user);

		activitytypes.push(activitytype);
	}

	return activitytypes;
}


module.exports = ActivitiesController;