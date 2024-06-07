const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');

var AllocatorsController = {};
var Allocator = require('./allocators/allocator');
var GroupAllocator = require('./allocators/GroupAllocator');

var types = [Allocator, GroupAllocator];


AllocatorsController.getAllocators = async (params) => {
	var res = await mongoose.model('allocator').find(params);

	return res;
};

AllocatorsController.getAllocator = async (id) => {
	var res = await mongoose.model('allocator').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

AllocatorsController.loadAllocator = async (id) => {
	let allocator = await AllocatorsController.getAllocator(id);
	
	if(!allocator){
		throw {message: 'Unable to load allocator.'}; 
	}
	return AllocatorsController.castToClass(allocator);
}

AllocatorsController.getTypes = function(){
	return types;
};

AllocatorsController.createAllocator = async (type) => {
	for (var i = 0; i < types.length; i++) {
		if(types[i].getType() == type){
			var allocator = new types[i]();

			var result = await allocator.save();

			return allocator;
		}
	}

	throw {message: 'Unknown allocator type'}; 
}

AllocatorsController.deleteAllocator = async (id) => {
	var res = await mongoose.model('allocator').deleteOne({_id: id});

	logger.info(res);

	return res;
}

AllocatorsController.castToClass = function(allocator){
	for (var i = 0; i < types.length; i++) {
		if(types[i].getType() == allocator.type){
			allocator = new types[i](allocator);
			return allocator;
		}
	}
	return null;
}

AllocatorsController.getAllocatorTypes = async (user) => {
	let allocatortypes = [];

	for (let i = 0; i < types.length; i++) {
		let allocatortype = {};
		allocatortype.type = types[i].getType();
		allocatortype.name = types[i].getName();
		allocatortype.description = types[i].getDescription();

		allocatortypes.push(allocatortype);
	}

	return allocatortypes;
}

module.exports = AllocatorsController;