const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');
const WebSocket = require('ws');

var ActivitiesController = {};
var Activity = require('./activities/activity');
var LimeSurveyActivity = require('./activities/LimeSurveyActivity');
var RageAnalyticsActivity = require('./activities/RageAnalyticsActivity');
var MinioActivity = require('./activities/MinioActivity');
var RageMinioActivity = require('./activities/RageMinioActivity');
var GameplayActivity = require('./activities/GameplayActivity');
var ManualActivity = require('./activities/ManualActivity');
var LTIToolActivity = require('./activities/LTIToolActivity');
var ImsPackageActivity = require('./activities/ImsPackageActivity');
const wsManager = require('./utils/wsManager');  // Import WebSocketManager

var types = [
	Activity,
	LimeSurveyActivity,
	/*RageAnalyticsActivity, MinioActivity, RageMinioActivity, */
	GameplayActivity,
	ManualActivity,
	LTIToolActivity,
	ImsPackageActivity
];

// Function to notify a specific client when an activity is completed
ActivitiesController.notifyActivityCompletion = (clientId, activityId) => {
    const message = {
        type: 'activity_completed',
        activityId: activityId,
        message: `Activity ${activityId} has been completed!`
    };

    // Send the message to the specific client
    wsManager.sendMessageToClient(clientId, message);
}

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

ActivitiesController.getActivityParticipants = async (id) => {
	let res = await mongoose.model('activity').find({_id: id});

	if(res.length > 0) {
		if(res[0].extra_data && res[0].extra_data.participants) {
			return Object.keys(res[0].extra_data.participants);
		}
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
				if(files.survey){
					params.rawsurvey = Buffer.from(files.survey, '7bit').toString('base64');
				}
				
				if(files.imspackage){
					let movefile = async () => {
						new Promise((resolve, reject) => {
							fs.stat('uploads', function(error, stats){
								if(error){
									fs.mkdir('uploads', function(error){
										if(error){
											reject({ message: 'Unable to create the base directory.', error: error });
										}else{
											files.imspackage.mv('uploads', function(error, result){
												if(error){
													reject(error);
												}else{
													resolve(result);
												}
											});
										}
									});
								}else{
									files.imspackage.mv('uploads', function(error, result){
										if(error){
											reject(error);
										}else{
											resolve(result);
										}
									});
								}
							});
						});
					};


					try{
						await movefile();
					}catch(e){
						throw { message: 'Error moving the file', error: e };
					}

					params.file_name = files.imspackage.name;
				}
			}

			var activity = new types[i](params);

			var result = await activity.save();

			return activity.toObject();
		}
	}

	throw {message: 'Unknown activity type'}; 
}

ActivitiesController.updateActivity = async (id, activity) => {
	let act = await ActivitiesController.loadActivity(id);

	if(act) {
		var result =await activity.save();
		logger.info(result);
	} else {
		throw {message: 'Unknown activity type'}; 
	}
}

ActivitiesController.deleteActivity = async (id) => {
	let activity = await ActivitiesController.loadActivity(id);

	if(activity) {
		return await activity.remove();
	}else{
		return null;
	}
};

ActivitiesController.getPresignedFileUrl = async (id) => {
	logger.info('ActivitiesController.getPresignedFileUrl')
	logger.info(id)
	let activity = await ActivitiesController.loadActivity(id);
	if(activity) {
		logger.info('GamePlayActivity : getPresignedFileUrl');
		if (activity.extra_data.config.trace_storage === true) {			
			logger.info('Trace storage existing... getting URL..');
			if(activity.extra_data.miniotrace) {
				logger.info('URL found in object...');
				logger.info(activity.extra_data.miniotrace);
				const now = new Date();
				logger.info(`Now : ${now.toISOString()}`);
				const generated = new Date(activity.extra_data.miniotrace.generated_at);
				logger.info(`Generated : ${generated.toISOString()}`);
				const milliseconds = 0.9 * Number(activity.extra_data.miniotrace.expire_on_seconds) * 1000; // 1 seconds = 1000 milliseconds
				logger.info(`Expire in (milliseconds) : ${milliseconds}`);
				const expire_at = new Date(generated.getTime() + milliseconds);
				logger.info(`Expire at : ${expire_at.toISOString()}`);
				if(now>=expire_at) {
					logger.info('URL expired.. Generating a new one...');
					await activity.generatePresignedFileUrl();
					await ActivitiesController.updateActivity(activity._id, activity);
				}
			} else {
				await activity.generatePresignedFileUrl();
				await ActivitiesController.updateActivity(activity._id, activity);
			}
			return activity.extra_data.miniotrace.presignedUrl;
		} else {
			throw 'Error not a trace storage for this activity';
		}
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