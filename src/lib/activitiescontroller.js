const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');

var ActivitiesController = {};
var Activity = require('./activities/activity');
var LimeSurveyActivity = require('./activities/LimeSurveyActivity');
var MinioActivity = require('./activities/MinioActivity');
var GameplayActivity = require('./activities/GameplayActivity');
var ManualActivity = require('./activities/ManualActivity');
var LTIToolActivity = require('./activities/LTIToolActivity');
var ImsPackageActivity = require('./activities/ImsPackageActivity');

var types = [
	Activity,
	LimeSurveyActivity,
	/*MinioActivity, */
	GameplayActivity,
	ManualActivity,
	LTIToolActivity,
	ImsPackageActivity
];

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

ActivitiesController.exportActivity = async (id, complete) => {
	let activity = await ActivitiesController.loadActivity(id);
	return await activity.export(complete);
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
		if (activity.extra_data.config.trace_storage) {
			logger.info('Trace storage existing... getting URL..');
			if(activity.extra_data.miniotrace && Object.keys(activity.extra_data.miniotrace).length != 0) {
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

ActivitiesController.addOwnersToActivity = async (id, owners) => {
	let activity = await ActivitiesController.loadActivity(id);
	await activity.addOwners(owners);
}

ActivitiesController.removeOwnersFromActivity = async (id, owners) => {
	let activity = await ActivitiesController.loadActivity(id);
	await activity.removeOwners(owners);
}

ActivitiesController.addParticipantsToActivity = async (id, participants) => {
	let activity = await ActivitiesController.loadActivity(id);
	logger.debug("Activity: " + JSON.stringify(activity));
	if(!await activity.addParticipants(participants)){
		throw { message: 'Error adding participants to activity: ' + id};
	}
	logger.debug("ActivitiesController.addParticipants finished");
}

ActivitiesController.removeParticipantsFromActivity = async (id, participants) => {
	let activity = await ActivitiesController.loadActivity(id);
	logger.debug("Activity: " + JSON.stringify(activity));
	if(!await activity.removeParticipants(participants)){
		throw { message: 'Error removing participants from activity: ' + id };
	}
	logger.debug("ActivitiesController.removeParticipants finished");
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