const ServerError = require('./error');
var mongoose = require('mongoose');

var StudiesController = {};


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
	var Study = mongoose.model('study');

	var result = await Study.updateOne({ _id: id }, study);

	return result.ok > 0;
}


module.exports = StudiesController;