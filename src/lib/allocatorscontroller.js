const ServerError = require('./error');
var mongoose = require('mongoose');

var AllocatorsController = {};
var Allocator = require('./allocators/allocator');

var types = [Allocator];


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

	console.log(res);

	return res;
}

module.exports = AllocatorsController;