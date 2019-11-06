const ServerError = require('./error');
var mongoose = require('mongoose');

var StudiesController = {};
var AllocatorsController = require('./allocatorscontroller');
var GroupsController = require('./groupscontroller');
var TestsController = require('./testscontroller');

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    }
});

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

	// Extracting the IDs of the differences between the saved list 
	// of groups and the new list of groups
	let deleted = old.groups.filter(x => !study.groups.includes(x));
	let added = study.groups.filter(x => !old.groups.includes(x));

	if(deleted.length > 0 || added.length > 0){
		// Getting all the IDs of the groups and loading them all at
		// once for optimization.
		let allgroups = [old.groups, study.groups].flat();
		allgroups = allgroups.filter((g,i) => allgroups.indexOf(g) === i);
		var loadedgroups = await GroupsController.getGroups({"_id" : {"$in" : allgroups}});

		// Filtering loadedgroups to obtain the old groups
		var oldgroups = loadedgroups.filter(x => old.groups.includes(x._id.toString()));

		// Getting the new groups added.
		var groupsadded = loadedgroups.filter(x => added.includes(x._id.toString()) );

		// If there is a difference in length between the loaded and IDs
		// then there is a group that does not exist.
		if(groupsadded.length !== added.length){
			let sgroups = groupsadded.map(g => { return g._id; });
			let notfound = added.filter(x => !sgroups.includes(x));

			throw {message: 'The following groups were not found: ' + notfound};
		}

		// Once we have the final lists of groups added, we filter also the
		// removed groups and the new groups.
		var groupsremoved = loadedgroups.filter(x => deleted.includes(x._id.toString()));
		var newgroups = loadedgroups.filter(x => study.groups.includes(x._id.toString()));

		// Finally, we calculate which are the new participands and removed
		// participants to be propagated to tests, activities and allocator
		let poriginal = oldgroups.map(g => {return g.participants; }).flat();
		poriginal = poriginal.filter((p,i) => poriginal.indexOf(p) === i );

		let pnew = newgroups.map(g => {return g.participants; }).flat();
		pnew = pnew.filter((p,i) => pnew.indexOf(p) === i );

		let padded = groupsadded.map(g => {return g.participants; }).flat();
		padded = padded.filter((p,i) => padded.indexOf(p) === i && !poriginal.includes(p));

		let premoved = groupsremoved.map(g => {return g.participants; }).flat();
		premoved = premoved.filter((p,i) => premoved.indexOf(p) === i && !pnew.includes(p));

		for (var i = 0; i < study.tests.length; i++) {
			console.log('modifying participants for test: ' + study.tests[i])
			if(padded.length > 0){
				await TestsController.addParticipants(study.tests[i], padded);
			}

			if(premoved.length > 0){
				await TestsController.removeParticipants(study.tests[i], premoved);
			}
		}
	}

	console.log('updating');
	var result = await Study.updateOne({ _id: id }, study);

	if(result.ok !== result.n){
		throw {message: 'There was an error in the study.'};
	}

}catch(e){
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

	let result = await Study.findOneAndUpdate({ _id: id }, { "$push": { tests: test._id} });

	if(result.ok !== result.n){
		throw {message: 'There was an error in the study.'};
	}

	if(test.activities.length > 0){
		let study = await StudiesController.getStudy(id);
		await TestsController.addParticipants(test._id, StudiesController.getParticipants(study));
	}

	return test;
}

module.exports = StudiesController;