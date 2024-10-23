const logger = require('./logger');

const ServerError = require('./error');
var mongoose = require('mongoose');
var InstancesController = {};

InstancesController.getInstances = async (params) => {
	var res = await mongoose.model('instance').find(params);

	return res;
};

InstancesController.getInstance = async (id) => {
	var res = await mongoose.model('instance').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

InstancesController.addInstance = async (instance) => {
	var Instance = mongoose.model('instance');

	var instance = new Instance(instance);

	await instance.save();

	return instance;
}

StudiesController.deleteInstance = async (id, instance) => {
	var instance = await mongoose.model('instance').findOne({_id: id});

	if(!instance){
		return null;
	}else{
		return await mongoose.model('instance').deleteOne({_id: id});
    }
}


module.exports = InstancesController;