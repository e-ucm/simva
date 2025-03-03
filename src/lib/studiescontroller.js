const logger = require('./logger');

const ServerError = require('./error');
var mongoose = require('mongoose');

var StudiesController = {};
var AllocatorsController = require('./allocatorscontroller');
var GroupsController = require('./groupscontroller');
var TestsController = require('./testscontroller');
const { groupBy } = require('async');
const ActivitiesController = require('./activitiescontroller');
const config=require("./config");

if(!Array.prototype.flat){
	Object.defineProperty(Array.prototype, 'flat', {
	    value: function(depth = 1) {
	      return this.reduce(function (flat, toFlatten) {
	        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
	      }, []);
	    }
	});
}

StudiesController.getStudies = async (params) => {
	var res = await mongoose.model('study').find(params);

	return res;
};

StudiesController.updateStudyIdInTestsAndActivitiesMigration = async () => {
	let studies = await StudiesController.getStudies();
	for(let i=0; i < studies.length; i++) {
		let study = studies[i];
		let studyid = study._id.toString();
		logger.info("Study : " + studyid);
		try {
			let updateStudy=false;
			if(study.version && study.version === 1) {
				logger.info("Study already updated.");
			} else {
				study.version = 1;
				study.active = false;
				updateStudy=true;
			}
			if(study.shlink && study.shlink.domain === config.shlink.apihost) {
				logger.info("Study shlink domain ok.");
			} else {
				study.shlink=null;
				updateStudy=true;
			}
			if(updateStudy) {
				await StudiesController.updateStudy(studyid, study);
			}
		} catch(e) {
			logger.error("Error updating study");
		}
		for(let j=0; j < study.tests.length; j++) {
			let testid = study.tests[j];
			logger.info("Test : " + testid);
			let test = await TestsController.getTest(testid);
			delete test.id;
			if(test.study !== "") {
				logger.info("StudyId already present in test.");
			} else {
				test.study = studyid;
				await test.save();
				logger.info("Test saved");
			}
			for(let k=0; k < test.activities.length; k++) {
				let activityid = test.activities[k];
				logger.info("Activity : " + activityid);
				let activity = await ActivitiesController.loadActivity(activityid);
				if(activity.type == "limesurvey" && activity.extra_data && !activity.extra_data.language) {
					if(activity.study !== "") {
						logger.info("StudyId already present in activity.");
					} else {
						activity.study = studyid;
					}
					await activity.save();
					logger.info("Language in limesurvey activity saved");
				} else if(activity.type == "gameplay"
					&& activity.extra_data && activity.extra_data.config
					&& (typeof activity.extra_data.config.trace_storage == "string" || typeof activity.extra_data.config.realtime == "string"  || typeof activity.extra_data.config.backup == "string")) {
					if(activity.study !== "") {
						logger.info("StudyId already present in activity.");
					} else {
						activity.study = studyid;
					}
					await activity.save();
					logger.info("Fix config extra_data in gameplay activity saved");
				} else {
					if(activity.study !== "") {
						logger.info("StudyId already present in activity.");
					} else {
						activity.study = studyid;
						await activity.save();
						logger.info("Activity saved");
					}
				}
			}
		}
	}
};

StudiesController.getStudy = async (id) => {
	var res = await mongoose.model('study').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

StudiesController.addStudy = async (study) => {
	var Study = mongoose.model('study');

	var study = new Study(study);

	await study.save();

	return study;
}

StudiesController.updateStudy = async (id, study) => {
	try{
		var Study = mongoose.model('study');

		var old = await mongoose.model('study').findOne({_id: id});

		if(!old) {
			throw {message: 'Unable to load the study to update.'};
		}

		let testsdeleted = old.tests.filter(x => !study.tests.includes(x));
		let testsadded = study.tests.filter(x => !old.tests.includes(x));

		if(testsadded.length > 0) {
			throw { message: 'Tests can be added through PUT interface, use POST /study/:id/tests' };
		}

		if(testsdeleted.length > 0) {
			for (var i = 0; i < testsdeleted.length; i++) {
				await TestsController.deleteTest(testsdeleted[i]);
			}
		}

		logger.debug('Actual study: ' + JSON.stringify(study));
		//Getting allocator
		allocator=await AllocatorsController.getAllocator(study.allocator);
		OldAllocator=await AllocatorsController.getAllocator(old.allocator);
		logger.debug('Allocator: ' + JSON.stringify(allocator));
		logger.debug('Previous Allocator: ' + JSON.stringify(OldAllocator));
		
		allocatorType=allocator.type;
		previousAllocatorType=OldAllocator.type;
		logger.debug('Allocator type: ' + allocatorType + '| Previous Allocator type: ' + previousAllocatorType);
		let allgroups = study.groups;
		var loadedgroups = await GroupsController.getGroups({"_id" : {"$in" : allgroups}});
		let allUsers = loadedgroups.map(g => {return g.participants; }).flat();
		logger.debug("All users :" + allUsers);
		let pnotallocated = allUsers
		if(allocator.extra_data && allocator.extra_data.allocations){ 
			pnotallocated = allUsers.filter(x => !Object.keys(allocator.extra_data.allocations).includes(x));
		}
		if(allocatorType == "default") {
			logger.debug('Participants not allocated: ' + pnotallocated);
		}
		logger.debug(study.tests + " | length :" + study.tests.length)
		for (var i = 0; i < study.tests.length; i++) {
			var testId = study.tests[i]
			var test = await TestsController.getTest(testId);
			logger.debug('Update participants for test: ' + testId);
			var actualTestParticipants = await TestsController.getTestParticipants(testId);
			logger.debug("ActualTestParticipants : " + actualTestParticipants);
			let allocation = [];
			if(i == 0) {
				if(allocatorType == "default") {
					allocation=allocation.concat(pnotallocated);
				} else {
					let updatedAllocator=await AllocatorsController.loadAllocator(allocator._id);
					logger.debug('Before adding | Updated Allocator: ' + JSON.stringify(updatedAllocator));
					logger.debug("Groups : " + allgroups);
					for (var j = 0; j < allgroups.length; j++) {
						var gr=allgroups[j];
						logger.debug('Updating Allocator: GroupID : '+ gr + "| testId :" + testId);	
						updatedAllocator.allocate(gr,testId);
					}
					await updatedAllocator.save();
					logger.debug('After adding |Updated Allocator: ' + JSON.stringify(updatedAllocator));
					allocator=updatedAllocator;
				}
			}
			if(allocator.extra_data && allocator.extra_data.allocations){ 
				//Getting allocation
				for([key, value] of Object.entries(allocator.extra_data.allocations)) {
					if(value==testId) {
						allocation.push(key);
					}
				}
				//Change from group to users
				if(allocatorType == "group") {
					logger.debug('Allocation group: ' + allocation);
					alloc=[]
					for (var j = 0; j < allocation.length; j++) {
						var gr=await GroupsController.getGroup(allocation[j]);
						if(gr != null)  {
							alloc=alloc.concat(gr.participants);
						}
					}
					allocation=alloc;
				} else {
					if(i == 0) {
						allocation=allocation.concat(pnotallocated);
					}
				}
			}
			logger.debug('Allocation participants: ' + allocation);
			let padded, premoved
			if(actualTestParticipants == null) {
				padded=allocation
				premoved=[]
			} else {
				premoved = actualTestParticipants.filter(x => !allocation.includes(x));
				padded = allocation.filter(x => !actualTestParticipants.includes(x));
			}
			logger.debug("Test BEFORE ALL :" + JSON.stringify(test));
			if(padded.length > 0){
				logger.debug('Participants to add: ' + padded);
				test=await TestsController.addParticipants(testId, padded);
				logger.debug('Participants added!');
			}
			logger.debug("Test AFTER ADDING PARTICIPANTS :" + JSON.stringify(test));
			if(premoved.length > 0){
				logger.debug('Participants to remove: ' + premoved);
				test=await TestsController.removeParticipants(testId, premoved);
				logger.debug('Participants removed!');
			}
			logger.debug("Test AFTER ALL :" +  JSON.stringify(test));
			await TestsController.updateTest(testId, test);
			logger.debug(study.tests);
		}
		logger.debug("All tests updated!");
		var result = await Study.updateOne({ _id: id }, study);
		if(result.ok !== result.n){
			throw {message: 'There was an error in the study.'};
		}
		logger.debug("Study updated!");
	} catch(e) {
		logger.error(e);
	}

	return await mongoose.model('study').findOne({_id: id});
}

StudiesController.getParticipants = async (study) => {
	var groups = await GroupsController.getGroups({"_id" : {"$in" : study.groups}});

	let participants = groups.map(g => {return g.participants; }).flat();
	participants = participants.filter((p,i) => participants.indexOf(p) === i);

	return participants;
}

StudiesController.removeOwners = async (study, owners) => {
	for (var i = 0; i < study.tests.length; i++) {
		await TestsController.removeOwners(study.tests[i], owners);
	}
	return true;
}

StudiesController.addOwners = async (study, owners) => {
	for (var i = 0; i < study.tests.length; i++) {
		await TestsController.addOwners(study.tests[i], owners);
	}
	return true;
}

StudiesController.addParticipants = async (study, participants) => {
	let allocator=await AllocatorsController.loadAllocator(study.allocator);
	for (var i = study.tests.length - 1; i >= 0; i--) {
		let testid = study.tests[i];
		let allocation=await allocator.getAllocatedForTest(testid);
		let participantsToAdd = allocation.filter(x => participants.includes(x));
		logger.info(`Test : ${testid}`);
		logger.info(participantsToAdd);
		await TestsController.addParticipants(testid, participantsToAdd);
	}

	return true;
}

StudiesController.removeParticipants = async (study, participants) => {
	let allocator=await AllocatorsController.loadAllocator(study.allocator);
	for (var i = study.tests.length - 1; i >= 0; i--) {
		let testid = study.tests[i];
		let allocation=await allocator.getAllocatedForTest(testid);
		let participantsToRemove = participants.filter(x => ! allocation.includes(x));
		logger.info(`Test : ${testid}`);
		logger.info(participantsToRemove);
		await TestsController.removeParticipants(testid, participantsToRemove);
	}

	return true;
}

StudiesController.addGroupToStudy = async (id, groupid) => {
	var Study = mongoose.model('study');

	//UpdateParticipants for all tests

	var result = await Study.findOneAndUpdate({ _id: id }, { "$push": { groups: groupid} });

	return result.ok > 0;
}


StudiesController.removeGroupToStudy = async (id, groupid) => {
	var Study = mongoose.model('study');

	//UpdateParticipants for all tests

	var result = await Study.findOneAndUpdate({ _id: id }, { "$pull": { groups: groupid} });

	return result.ok > 0;
}

StudiesController.deleteStudy = async (id, study) => {
	var study = await mongoose.model('study').findOne({_id: id});

	if(!study){
		return null;
	}else{
		for (var i = 0; i < study.tests.length; i++) {
			await TestsController.deleteTest(study.tests[i]);
		}
		
		if(await AllocatorsController.deleteAllocator(study.allocator)){
			return await mongoose.model('study').deleteOne({_id: id});
		}
	}
}

StudiesController.addTestToStudy = async (id, params) => {
	let Study = mongoose.model('study');
	let test = await TestsController.addTest(params);

	let result = await Study.updateOne({ _id: id }, { "$push": { tests: test._id} });

	if(result.ok !== result.n){
		throw {message: 'There was an error in the study.'};
	}

	if(params.from) {
		let prevtest = await TestsController.getTest(params.from);
		let testToCopy = await TestsController.getTestExport(prevtest, false);
		test.study = id;
		test = await TestsController.importTest(test, testToCopy, params.owner);
	}
	return test;
}

StudiesController.getActivitiesInStudy = async (id) => {
	let study = await StudiesController.getStudy(id);
	var tests = await TestsController.getTests({"_id" : {"$in" : study.tests}});
	var activities = [];
	for(var i=0; i< tests.length; i++)  {
		for(var j=0; j< tests[i].activities.length; j++)  {
			activities.push(tests[i].activities[j]);
		}
	}
	var activitiesObject = await ActivitiesController.getActivities({"_id" : {"$in" : activities}});
	return activitiesObject;
}


StudiesController.getStudyExport = async (id) => {
	let study = await StudiesController.getStudy(id);
	let exportedStudyTest = await TestsController.getTests({"_id" : {"$in" : study.tests}});
	let exportedTests = [];
	for(var i=0; i< exportedStudyTest.length; i++)  {
		exportedTests.push(await TestsController.getTestExport(exportedStudyTest[i], true));
	}
	let studyExport = {
		name : study.name,
		owners : study.owners,
		tests : exportedTests
	};
	return studyExport;
}


module.exports = StudiesController;