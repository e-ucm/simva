const ServerError = require('./error');
var mongoose = require('mongoose');

var ActivitiesController = {};
var Activity = require('./activities/activity');
var LimeSurveyActivity = require('./activities/LimeSurveyActivity');

var types = [Activity, LimeSurveyActivity];


ActivitiesController.getActivities = async (params) => {
	var res = await mongoose.model('activity').find(params);

	return res;
};

ActivitiesController.getActivity = async (id) => {
	var res = await mongoose.model('activity').find({_id: id});

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
		console.log(types[i].getType());
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
	var activity = await ActivitiesController.loadActivity(id);

	if(activity) {
		return await activity.delete();
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
	for (var i = 0; i < types.length; i++) {
		if(types[i].getType() == activity.type){
			activity = new types[i](activity);
			return activity;
		}
	}
	return null;
}


module.exports = ActivitiesController;