const ServerError = require('./error');
var mongoose = require('mongoose');

var StudiesController = {};
var AllocatorsController = require('./allocatorscontroller');
var GroupsController = require('./groupscontroller');
var TestsController = require('./testscontroller');
const { groupBy } = require('async');

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

		if(!old){
			throw {message: 'Unable to load the study to update.'};
		}

		let testsdeleted = old.tests.filter(x => !study.tests.includes(x));
		let testsadded = study.tests.filter(x => !old.tests.includes(x));

		if(testsadded.length > 0){
			throw { message: 'Tests can be added through PUT interface, use POST /study/:id/tests' };
		}

		if(testsdeleted.length > 0){
			for (var i = 0; i < testsdeleted.length; i++) {
				await TestsController.deleteTest(testsdeleted[i]);
			}
		}

		console.log('Actual study: ' + JSON.stringify(study));
		//Getting allocator
		allocator=await AllocatorsController.getAllocator(study.allocator);
		OldAllocator=await AllocatorsController.getAllocator(old.allocator);
		console.log('Allocator: ' + JSON.stringify(allocator));
		console.log('Previous Allocator: ' + JSON.stringify(OldAllocator));
		
		allocatorType=allocator.type;
		previousAllocatorType=OldAllocator.type;
		console.log('Allocator type: ' + allocatorType + '| Previous Allocator type: ' + previousAllocatorType);
		let allgroups = study.groups;
		var loadedgroups = await GroupsController.getGroups({"_id" : {"$in" : allgroups}});
		let allUsers = loadedgroups.map(g => {return g.participants; }).flat();
		console.log("All users :" + allUsers);
		let pnotallocated = allUsers
		if(allocator.extra_data && allocator.extra_data.allocations){ 
			pnotallocated = allUsers.filter(x => !Object.keys(allocator.extra_data.allocations).includes(x));
		}
		if(allocatorType == "default") {
			console.log('Participants not allocated: ' + pnotallocated);
		}
		console.log(study.tests + " | length :" + study.tests.length)
		for (var i = 0; i < study.tests.length; i++) {
			var testId = study.tests[i]
			var test = await TestsController.getTest(testId);
			console.log('Update participants for test: ' + testId);
			var actualTestParticipants = await TestsController.getTestParticipants(testId);
			console.log("ActualTestParticipants : " + actualTestParticipants);
			let allocation = [];
			if(i == 0) {
				if(allocatorType == "default") {
					allocation=allocation.concat(pnotallocated);
				} else {
					let updatedAllocator=await AllocatorsController.loadAllocator(allocator._id);
					console.log('Before adding | Updated Allocator: ' + JSON.stringify(updatedAllocator));
					console.log("Groups : " + allgroups);
					for (var j = 0; j < allgroups.length; j++) {
						var gr=allgroups[j];
						console.log('Updating Allocator: GroupID : '+ gr + "| testId :" + testId);	
						updatedAllocator.allocate(gr,testId);
					}
					await updatedAllocator.save();
					console.log('After adding |Updated Allocator: ' + JSON.stringify(updatedAllocator));
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
					console.log('Allocation group: ' + allocation);
					alloc=[]
					for (var j = 0; j < allocation.length; j++) {
						var gr=await GroupsController.getGroup(allocation[j]);
						alloc=alloc.concat(gr.participants);
					}
					allocation=alloc;
				} else {
					if(i == 0) {
						allocation=allocation.concat(pnotallocated);
					}
				}
			}
			console.log('Allocation participants: ' + allocation);
			let padded, premoved
			if(actualTestParticipants == null) {
				padded=allocation
				premoved=[]
			} else {
				premoved = actualTestParticipants.filter(x => !allocation.includes(x));
				padded = allocation.filter(x => !actualTestParticipants.includes(x));
			}
			console.log("Test BEFORE ALL :" + JSON.stringify(test));
			if(padded.length > 0){
				console.log('Participants to add: ' + padded);
				test=await TestsController.addParticipants(testId, padded);
				console.log('Participants added!');
			}
			console.log("Test AFTER ADDING PARTICIPANTS :" + JSON.stringify(test));
			if(premoved.length > 0){
				console.log('Participants to remove: ' + premoved);
				test=await TestsController.removeParticipants(testId, premoved);
				console.log('Participants removed!');
			}
			console.log("Test AFTER ALL :" +  JSON.stringify(test));
			await TestsController.updateTest(testId, test);
			console.log(study.tests);
		}
		console.log("All tests updated!");
		var result = await Study.updateOne({ _id: id }, study);
		if(result.ok !== result.n){
			throw {message: 'There was an error in the study.'};
		}
		console.log("Study updated!");
	} catch(e) {
		console.log(e);
	}

	return await mongoose.model('study').findOne({_id: id});
}

StudiesController.getParticipants = async (study) => {
	var groups = await GroupsController.getGroups({"_id" : {"$in" : study.groups}});

	let participants = groups.map(g => {return g.participants; }).flat();
	participants = participants.filter((p,i) => participants.indexOf(p) === i);

	return participants;
}

StudiesController.addParticipants = async (study, participants) => {
	for (var i = study.tests.length - 1; i >= 0; i--) {
		await TestsController.addParticipants(study.tests[i], participants);
	}

	return true;
}

StudiesController.removeParticipants = async (study, participants) => {
	for (var i = study.tests.length - 1; i >= 0; i--) {
		await TestsController.removeParticipants(study.tests[i], participants);
	}

	return true;
}

StudiesController.addGroupToStudy = async (id, groupid) => {
	var Study = mongoose.model('study');

	//UpdateParticipants for all tests

	var result = await Study.findOneAndUpdate({ _id: id }, { "$push": { groups: groupid} });

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

	//if(test.activities.length > 0){
	//	let study = await StudiesController.getStudy(id);
	//	await TestsController.addParticipants(test._id, StudiesController.getParticipants(study));
	//}

	return test;
}

module.exports = StudiesController;