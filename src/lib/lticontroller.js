const ServerError = require('./error');
var mongoose = require('mongoose');

var LtiController = {};


LtiController.getLtiTools = async (params) => {
	var res = await mongoose.model('lti_tool').find(params);

	return res;
};

LtiController.getLtiTool = async (id) => {
	var res = await mongoose.model('lti_tool').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

LtiController.addLtiTool = async (tool) => {
	var LtiTool = mongoose.model('lti_tool');

	var tool = new LtiTool(tool);

	await tool.save();

	return tool;
}

LtiController.updateLtiTool = async (id, tool) => {
	var LtiTool = mongoose.model('lti_tool');

	var result = await LtiTool.updateOne({ _id: id }, tool);

	return result.ok > 0;
}


module.exports = LtiController;