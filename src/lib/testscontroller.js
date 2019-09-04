const ServerError = require('./error');
var mongoose = require('mongoose');

var TestsController = {};


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


module.exports = TestsController;