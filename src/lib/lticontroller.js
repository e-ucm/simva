const ServerError = require('./error');
var mongoose = require('mongoose');

var LtiController = {};

let lticlientbase = require('./utils/lticlientbase');
const KeycloakClient = require('./utils/keycloakclient');

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

	tool.extra_data = {};
	let random_num = Math.floor(Math.random() * (maxid-minid+1)+minid);
	tool.client_id = "lti-tool-" + random_num;

	try{
		tool.real_client_id = await LtiController.addClientToKeycloak(tool.client_id);
		await tool.save();
	}catch(e){
		console.log(e);
		throw { message: 'Error creating the tool', error: e };
	}
	

	return tool;
}

LtiController.updateLtiTool = async (id, tool) => {
	var LtiTool = mongoose.model('lti_tool');

	var result = await LtiTool.updateOne({ _id: id }, tool);

	return result.ok > 0;
}

LtiController.removeLtiTool = async (id) => {
	var LtiTool = mongoose.model('lti_tool');


	await LtiTool.deleteOne({ _id: id });

	return true;
}

LtiController.addClientToKeycloak = async(id) => {
	let client = JSON.parse(JSON.stringify(lticlientbase));

	client.clientId = id;

	await KeycloakClient.AuthClient();

	let createdClient = await KeycloakClient.getClient().clients.create(client);

	return createdClient.id;
}

LtiController.removeClientFromKeycloak = async(id) => {
	try{
		await KeycloakClient.AuthClient();

		let result = await KeycloakClient.getClient().clients.del({ id: id });
	}catch(e){
		console.log(e);
		throw { nessage: 'Error deleting the keycloak client', error: e};
	}
	
	return true;
}


module.exports = LtiController;