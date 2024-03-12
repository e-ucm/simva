const ServerError = require('./error');
var mongoose = require('mongoose');
var config = require('./config');
const jwt = require('jsonwebtoken');
let ltijs = require('ltijs').Provider;

var LtiController = {};

let lticlientbase = require('./utils/lticlientbase');
const KeycloakClient = require('./utils/keycloakclient');

let maxid = 100000;
let minid = 1;

let platformToJSON = async (platform) => {
	let ret = {
		_id: await platform.platformId(),
		name: await platform.platformName(),
		url: await platform.platformUrl(),
		clientId: await platform.platformClientId(),
		authenticationEndpoint: await platform.platformAuthenticationEndpoint(),
		accesstokenEndpoint: await platform.platformAccessTokenEndpoint(),
		authConfig: await platform.platformAuthConfig(),
		active: await platform.platformActive()
	};
	return ret;
}

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

LtiController.getLtiPlatforms = async (params) => {
	/*var res = await mongoose.model('lti_platform').find(params);

	return res;*/
	try{
		let platforms = await ltijs.getAllPlatforms();
		console.log(platforms);

		let result = [];

		for (var i = 0; i < platforms.length; i++) {
			console.log('transforming platform');
			result.push(await platformToJSON(platforms[i]));
		}

		console.log('completed');

		return result;
	}catch(e){
		console.log(e);
		throw { message: 'Error getting the platforms', error: e };
	}
};

LtiController.getLtiPlatform = async (id) => {
	/*var res = await mongoose.model('lti_platform').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}*/

	let platform = await ltijs.getPlatformById(id);

	if(platform !== null){
		return await platformToJSON(platform);
	}else{
		return null
	}
};

LtiController.addLtiPlatform = async (platform) => {
	//let internal_id = "";
	let registered_platform = null;

	 try {
		let p = {
			url: platform.url,
			name: platform.name,
			clientId: platform.clientId,
			authenticationEndpoint: platform.authenticationEndpoint,
			accesstokenEndpoint: platform.accesstokenEndpoint,
			authConfig: platform.authConfig
		};

		registered_platform = await ltijs.registerPlatform(p);

		internal_id = await registered_platform.platformId();
	} catch (err) {
		console.log(e);
		throw { message: 'Error creating the Platform in ltijs', error: e };
	}

	/*console.log('loading lib');

	var LtiPlatform = mongoose.model('lti_platform');

	var created_platform = new LtiPlatform(platform);
	created_platform.internal_id = internal_id;

	console.log(created_platform);

	try{
		await created_platform.save();
	}catch(e){
		console.log(e);
		throw { message: 'Error creating the Platform', error: e };
	}*/

	return await platformToJSON(registered_platform);
}

LtiController.updateLtiPlatform = async (id, platform) => {
	/*var LtiPlatform = mongoose.model('lti_platform');

	var result = await LtiPlatform.updateOne({ _id: id }, platform);

	return result.ok > 0; */
	return null;
}

LtiController.removeLtiPlatform = async (id) => {
	//var LtiPlatform = mongoose.model('lti_platform');

	try{
		/*let platform = await LtiController.getLtiPlatform(id);

		if(platform.internal_id){*/
			await ltijs.deletePlatformById(id);
		//}

		//await LtiPlatform.deleteOne({ _id: id });
	}catch(e){
		console.log(e);
		throw { message: 'Error deleting the platform', error: e};
	}
	
	return true;
}


module.exports = LtiController;