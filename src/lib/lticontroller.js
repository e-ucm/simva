const ServerError = require('./error');
var mongoose = require('mongoose');

var LtiController = {};

let lticlientbase = require('./utils/lticlientbase');
const KeycloakClient = require('./utils/keycloakkeymanager');

let maxid = 100000;
let minid = 1;

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

	//await tool.save();
	LtiController.addClientToKeycloak(Math.floor(Math.random() * (maxid-minid+1)+minid));

	return tool;
}

LtiController.updateLtiTool = async (id, tool) => {
	var LtiTool = mongoose.model('lti_tool');

	var result = await LtiTool.updateOne({ _id: id }, tool);

	return result.ok > 0;
}

LtiController.addClientToKeycloak = async(id) => {
	let client = JSON.parse(JSON.stringify(lticlientbase));

	client.clientId = id;

	const createdClient = await KeycloakClient.getClient().clients.create(client);

	console.log(JSON.stringify(createdClient));

	return id;
}

LtiController.removeClientFromKeycloak = async(id) => {

}


module.exports = LtiController;