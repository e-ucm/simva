const ServerError = require('./error');
var mongoose = require('mongoose');
var config = require('./config');
const jwt = require('jsonwebtoken');
let ltijs = require('ltijs').Provider;

var LtiController = {};

let lticlientbase = require('./utils/lticlientbase');
const KeycloakClient = require('./utils/keycloakclient');
const { CreateOrUpdateKeycloakUser } = require('./userscontroller');

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
	LtiController.Log('LtiController.getLtiTool(' + id + ')) : Start');
	var res = await mongoose.model('lti_tool').find({_id: id});

	if(res.length > 0) {
		LtiController.Log('LtiController.getLtiTool(' + id + ')) : Found');
		return res[0];
	}else{
		LtiController.Log('LtiController.getLtiTool(' + id + ')) : Not Found');
		return null;
	}
};

LtiController.addLtiTool = async (tool) => {
	LtiController.Log('LtiController.addLtiTool()) : Start');
	var LtiTool = mongoose.model('lti_tool');

	var tool = new LtiTool(tool);

	tool.extra_data = {};
	let random_num = Math.floor(Math.random() * (maxid-minid+1)+minid);
	tool.client_id = "lti-tool-" + random_num;
	LtiController.Log('LtiController.addLtiTool()) : Before Adding client to Keycloak : ' + JSON.stringify(tool));
	try{
		tool.extra_data.real_client_id = await LtiController.addClientToKeycloak(tool);
		LtiController.Log('LtiController.addLtiTool()) : After Adding client to Keycloak : ' + JSON.stringify(tool));
		await tool.save();
		LtiController.Log('LtiController.addLtiTool()) : Success');
	}catch(e){
		LtiController.Log('LtiController.addLtiTool()) : Error : ole' + e);
		throw { message: 'Error creating the tool', error: e };
	}
	

	return tool;
}

LtiController.updateLtiTool = async (id, tool) => {
	LtiController.Log('LtiController.updateLtiTool(' + id + ')) : Start');
	var LtiTool = mongoose.model('lti_tool');

	var result = await LtiTool.updateOne({ _id: id }, tool);
	LtiController.Log('LtiController.updateLtiTool(' + id + ')) : Success');
	return result.ok > 0;
}

LtiController.removeLtiTool = async (id) => {
	LtiController.Log('LtiController.removeLtiTool(' + id + ')) : Start');
	var LtiTool = mongoose.model('lti_tool');

	try{
		let tool = await LtiController.getLtiTool(id);
		await LtiController.removeClientFromKeycloak(tool.extra_data.real_client_id);
		await LtiTool.deleteOne({ _id: id });
		LtiController.Log('LtiController.removeLtiTool(' + id + ')) : Success.');
	}catch(e){
		LtiController.Log('LtiController.removeLtiTool(' + id + ')) : Error :' + e);
		throw { message: 'Error deleting the tool', error: e};
	}
	
	return true;
}

LtiController.getLtiContext = async (id) => {
	LtiController.Log('LtiController.getLtiContext(' + id + ') : Start');
	var res = await mongoose.model('lti_context').find({_id: id});

	if(res.length > 0) {
		LtiController.Log('LtiController.getLtiContext(' + id + ')) : Found');
		return res[0];
	}else{
		LtiController.Log('LtiController.getLtiContext(' + id + ')) : Not Found');
		return null;
	}
};

LtiController.addLtiContext = async (context) => {
	LtiController.Log('LtiController.addLtiContext(' + id + ') : Start');
	var LtiContext = mongoose.model('lti_context');

	var context = new LtiContext(context);

	try{
		await context.save();
		LtiController.Log('LtiController.addLtiContext(' + id + ') : Success');
	}catch(e){
		LtiController.Log('LtiController.addLtiContext(' + id + ') : ERROR : ' + e);
		throw { message: 'Error creating the context', error: e };
	}

	return context;
}

LtiController.addClientToKeycloak = async(tool) => {
	LtiController.Log('LtiController.addClientToKeycloak() : Start');
	let client = JSON.parse(JSON.stringify(lticlientbase));

	client.clientId = tool.client_id;
	client.redirectUris[0] = tool.redirect_uri;
	client.attributes['jwks.url'] = tool.jwks_uri;
	LtiController.Log('LtiController.addClientToKeycloak() : lti-mapper');
	for (var i = 0; i < client.protocolMappers.length; i++) {
		if(client.protocolMappers[i].name === 'lti-mapper'){
			client.protocolMappers[i].config['lti3_platform.url'] = config.external_url + config.LTI.platform.claims_url;
			client.protocolMappers[i].config['lti3_platform.auth.url'] = config.sso.realmUrl + '/protocol/openid-connect/token';
		}
	}
	LtiController.Log('LtiController.addClientToKeycloak() : Auth to Keycloak');
	await KeycloakClient.AuthClient();
	LtiController.Log('LtiController.addClientToKeycloak() : Creating client :' + JSON.stringify(client));
	let createdClient = await KeycloakClient.getClient().clients.create(client);
	LtiController.Log('LtiController.addClientToKeycloak() : Success. ID :' + createdClient.id);
	return createdClient.id;
}

LtiController.removeClientFromKeycloak = async(id) => {
	try{
		LtiController.Log('LtiController.removeClientFromKeycloak(' + id + ') : Start');
		await KeycloakClient.AuthClient();

		let result = await KeycloakClient.getClient().clients.del({ id: id });
		LtiController.Log('LtiController.removeClientFromKeycloak(' + id + ') : Success');
	}catch(e){
		LtiController.Log('LtiController.removeClientFromKeycloak(' + id + ') : ERROR :' + e);
		throw { message: 'Error deleting the keycloak client', error: e};
	}
	
	return true;
}

LtiController.generateJWT = async (data) => {
	LtiController.Log('LtiController.generateJWT()');
	return jwt.sign(data, config.JWT.secret, { expiresIn: config.JWT.expiresIn, issuer: config.JWT.issuer });
}

LtiController.decodeJWT = async (token) => {
	return new Promise((resolve, reject) => {
		LtiController.Log('LtiController.decodeJWT() : Start');
		jwt.verify(token, config.JWT.secret, function(error, decoded) {
			if(error){
				LtiController.Log('LtiController.decodeJWT() : Error :' + JSON.stringify(error));
				reject(error);
			}else{
				LtiController.Log('LtiController.decodeJWT() : Success');
				LtiController.Log('LtiController.decodeJWT() : Decoded : ' + JSON.stringify(decoded));
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
		LtiController.Log('LtiController.getLtiPlatforms():' + JSON.stringify(platforms));

		let result = [];

		for (var i = 0; i < platforms.length; i++) {
			LtiController.Log('LtiController.getLtiPlatforms(): Transforming platforms');
			result.push(await platformToJSON(platforms[i]));
		}

		LtiController.Log('LtiController.getLtiPlatforms(): Completed');

		return result;
	}catch(e){
		LtiController.Log('LtiController.getLtiPlatforms(): Error :' + e);
		throw { message: 'Error getting the platforms', error: e };
	}
};

LtiController.getLtiPlatform = async (id) => {
	LtiController.Log('LtiController.getLtiPlatform(' + id + '): Start');
	let platform = await ltijs.getPlatformById(id);

	if(platform !== null){
		LtiController.Log('LtiController.getLtiPlatform(' + id + '): Success');
		return await platformToJSON(platform);
	}else{
		LtiController.Log('LtiController.getLtiPlatform(' + id + '): Not found');
		return null
	}
};

LtiController.addLtiPlatform = async (platform) => {
	LtiController.Log('LtiController.addLtiPlatform(): Start');
	
	LtiController.Log('LtiController.addLtiPlatform(): Adding Platform: ' + JSON.stringify(platform));
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
		LtiController.Log('LtiController.addLtiPlatform(): Registered ID: ' + internal_id);
	} catch (err) {
		LtiController.Log('LtiController.addLtiPlatform(): Error: ' + JSON.stringify(err));
		throw { message: 'Error creating the Platform in ltijs', error: err };
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
	LtiController.Log('LtiController.updateLtiPlatform(): Start');
	/*var LtiPlatform = mongoose.model('lti_platform');

	var result = await LtiPlatform.updateOne({ _id: id }, platform);

	return result.ok > 0; */
	LtiController.Log('LtiController.updateLtiPlatform(): Success');
	return null;
}

LtiController.removeLtiPlatform = async (id) => {
	LtiController.Log('LtiController.removeLtiPlatform(' + id + '): Started');
	//var LtiPlatform = mongoose.model('lti_platform');

	try{
		/*let platform = await LtiController.getLtiPlatform(id);

		if(platform.internal_id){*/
			await ltijs.deletePlatformById(id);
		//}

		//await LtiPlatform.deleteOne({ _id: id });
	LtiController.Log('LtiController.removeLtiPlatform(' + id + '): Success');
	}catch(e){
		LtiController.Log('LtiController.removeLtiPlatform(' + id + '): Error: ' + JSON.stringify(e));
		throw { message: 'Error deleting the platform', error: e};
	}
	
	return true;
}

LtiController.Log = function(message){
	if(config.LTI.loggerActive){
		console.info('\x1b[33m%s\x1b[0m', message);
	}
}


module.exports = LtiController;