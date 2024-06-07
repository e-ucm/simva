const logger = require('./logger');

const ServerError = require('./error');
var mongoose = require('mongoose');

var TestsController = {};
var ActivitiesController = require('./activitiescontroller');

TestsController.getTests = async (params) => {
	var res = await mongoose.model('test').find(params);

	return res;
};

TestsController.getTest = async (id) => {
	var res = await mongoose.model('test').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

TestsController.getTestParticipants = async (id) => {
	var res = await mongoose.model('test').find({_id: id});

	if(res.length > 0) {
		return await ActivitiesController.getActivityParticipants(res[0].activities[0]);
	}else{
		return null;
	}
};


TestsController.addTest = async (test) => {
	var Test = mongoose.model('test');

	var test = new Test(test);

	await test.save();

	return test;
}

TestsController.updateTest = async (id, test) => {
	var Test = mongoose.model('test');

	var result = await Test.updateOne({ _id: id }, test);

	return result.ok > 0;
}

TestsController.deleteTest = async (id) => {
	var test = await TestsController.getTest(id);

	for (var i = 0; i < test.activities.length; i++) {
		let activity = await ActivitiesController.loadActivity(test.activities[i]);
		if(!await activity.remove()){
			throw { message: 'Unable to delete activity: ' . activity.id };
		}
	}

	var result = await mongoose.model('test').deleteOne({_id: id});

	return result.ok > 0;
}

TestsController.getActivities = async (id) => {

}

TestsController.addActivityToTest = async (id, activity) => {
	
}

TestsController.removeActivityToTest = async (id, activity) => {
	
}

TestsController.addParticipants = async (id, participants) => {
	var test = await TestsController.getTest(id);
	logger.info("BEFORE ADD: " + JSON.stringify(test) + " | Participants " + participants);
	logger.info("TestsController.addParticipants started");
	for (var i = 0; i < test.activities.length; i++) {
		let activity = await ActivitiesController.loadActivity(test.activities[i]);
		logger.info("Activity: " + JSON.stringify(activity));
		if(!await activity.addParticipants(participants)){
			throw { message: 'Error adding participants to activity: ' + test.activities[i] };
		}
		logger.info("TestsController.addParticipants finished");
	}
	return test;
}

TestsController.removeParticipants = async (id, participants) => {
	var test = await TestsController.getTest(id);
	logger.info("BEFORE REMOVE: " + JSON.stringify(test) + " | Participants " + participants);
	logger.info("TestsController.removeParticipants started");
	try{
		for (var i = 0; i < test.activities.length; i++) {
			let activity = await ActivitiesController.loadActivity(test.activities[i]);
			logger.info("Activity: " + JSON.stringify(activity));
			if(!await activity.removeParticipants(participants)){
				throw { message: 'Error removing participants from activity: ' + test.activities[i] };
			}
		}
		logger.info("TestsController.removeParticipants finished");
	}catch(e){
		logger.info(e);
	}
	return test;
}


module.exports = TestsController;