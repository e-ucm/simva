const ServerError = require('./error');
var mongoose = require('mongoose');
var config = require('./config');
const jwt = require('jsonwebtoken');
let ltijs = require('./lti/tool');

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
		tool.extra_data.real_client_id = await LtiController.addClientToKeycloak(tool);
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

	try{
		let tool = await LtiController.getLtiTool(id);
		await LtiController.removeClientFromKeycloak(tool.extra_data.real_client_id);
		await LtiTool.deleteOne({ _id: id });
	}catch(e){
		console.log(e);
		throw { message: 'Error deleting the tool', error: e};
	}
	
	return true;
}

LtiController.getLtiContext = async (id) => {
	var res = await mongoose.model('lti_context').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

LtiController.addLtiContext = async (context) => {
	var LtiContext = mongoose.model('lti_context');

	var context = new LtiContext(context);

	try{
		await context.save();
	}catch(e){
		console.log(e);
		throw { message: 'Error creating the context', error: e };
	}

	return context;
}

LtiController.addClientToKeycloak = async(tool) => {
	let client = JSON.parse(JSON.stringify(lticlientbase));

	client.clientId = tool.client_id;
	client.redirectUris[0] = tool.redirect_uri;
	client.attributes['jwks.url'] = tool.jwks_uri;

	for (var i = 0; i < client.protocolMappers.length; i++) {
		if(client.protocolMappers[i].name === 'lti-mapper'){
			client.protocolMappers[i].config['lti3_platform.url'] = config.external_url + config.LTI.platform.claims_url;
			client.protocolMappers[i].config['lti3_platform.auth.url'] = config.sso.realmUrl + '/protocol/openid-connect/token';
		}
	}

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

LtiController.generateJWT = async (data) => {
	return jwt.sign(data, config.JWT.secret, { expiresIn: config.JWT.expiresIn, issuer: config.JWT.issuer });
}

LtiController.decodeJWT = async (token) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, config.JWT.secret, function(error, decoded) {
			if(error){
				reject(error);
			}else{
				resolve(decoded);
			}
		});
	});
}

LtiController.addLtiPlatform = async (platform) => {
	console.log('adding platform');
	console.log(platform);
	let internal_id = "";

	 try {
	 	console.log('prepare');
	 	console.log(platform);
	 	console.log("prepared")
		let p = {
			url: platform.url,
			name: platform.name,
			clientId: platform.clientId,
			authenticationEndpoint: platform.authenticationEndpoint,
			accesstokenEndpoint: platform.accesstokenEndpoint,
			authConfig: platform.authConfig
		};

		console.log(p);

		let registered_platform = await ltijs.provider.registerPlatform(p);

		let result = await registered_platform.platformJSON();
		internal_id = result._id
	} catch (err) {
		console.log(e);
		throw { message: 'Error creating the Platform in ltijs', error: e };
	}

	var LtiPlatform = mongoose.model('lti_platform');

	var created_platform = new LtiPlatform(platform);
	created_platform.internal_id = internal_id;

	try{
		await created_platform.save();
	}catch(e){
		console.log(e);
		throw { message: 'Error creating the Platform', error: e };
	}
	

	return created_platform;
}

LtiController.updateLtiPlatform = async (id, platform) => {
	var LtiPlatform = mongoose.model('lti_platform');

	var result = await LtiPlatform.updateOne({ _id: id }, platform);

	return result.ok > 0;
}

LtiController.removeLtiPlatform = async (id) => {
	var LtiPlatform = mongoose.model('lti_platform');

	try{
		let platform = await LtiController.getLtiPlatform(id);
		//await ltijs.provider.deleteplatform(platform.internal_id) REMOVE PLATFORM
		await LtiPlatform.deleteOne({ _id: id });
	}catch(e){
		console.log(e);
		throw { message: 'Error deleting the platform', error: e};
	}
	
	return true;
}


module.exports = LtiController;