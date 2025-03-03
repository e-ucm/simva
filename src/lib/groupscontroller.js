const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');

var GroupsController = {};


GroupsController.getGroups = async (params) => {
	var res = await mongoose.model('group').find(params);

	return res;
};

GroupsController.getGroup = async (id) => {
	var res = await mongoose.model('group').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

GroupsController.addGroup = async (group) => {
	var Group = mongoose.model('group');

	var group = new Group(group);

	await group.save();

	return group;
}

GroupsController.updateGroup = async (id, group) => {
	var Group = mongoose.model('group');

	var result = await Group.updateOne({ _id: id }, group);

	return result.ok > 0;
}

GroupsController.removeGroup = async (id) => {
	let result = await mongoose.model('group').deleteOne({_id: id});

	if(result){
		logger.debug('Group removed');
	}else{
		logger.info('Error removing the group');
	}

	return result;
}


module.exports = GroupsController;