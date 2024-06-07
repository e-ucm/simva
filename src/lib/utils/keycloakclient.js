const logger = require('../logger');
// Using version 18.0.2 instead of 23.0.7
// https://github.com/keycloak/keycloak/issues/19829
// https://github.com/keycloak/keycloak-nodejs-admin-client/issues/523
const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

logger.info(KcAdminClient);
 
var async = require('async');
var config = require('../config');
var request = require('request');

var options = {
	url: config.sso.webhookUrl,
	method: "POST",
	headers: {
		'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
    	'connection': 'keep-alive',
    	'content-type': 'application/json'
  	}
}

var KeycloakClient = {};

let kcconfig = {
	baseUrl: config.sso.url,
	realmName: config.sso.realm
};

let kcAdminClient = new KcAdminClient(kcconfig);


let KeycloakUserCredentials = {
  username: config.sso.adminUser,
  password: config.sso.adminPassword,
  grantType: 'password',
  clientId: 'admin-cli'
};

logger.info('----- KEYCLOAK -----');
logger.info('Keycloak-> Connecting to: ');
logger.info(JSON.stringify(kcconfig, null, 2));
logger.info('Keycloak-> Authentication: ');
logger.info(JSON.stringify(KeycloakUserCredentials, null, 2));
logger.info('--------------------');

let keycloakStatus = false;
if(config.sso.enabled){
	kcAdminClient.auth(KeycloakUserCredentials)
	.then((result) => {
		logger.info(kcAdminClient.getAccessToken());
		logger.info('Connected to Keycloak!');
		keycloakStatus = true;
	})
	.catch((error) => {
		logger.info('Unable to connect to keycloak');
		logger.info(error);
		keycloakStatus = false;
	});
}

KeycloakClient.AuthClient = async () => {
	await kcAdminClient.auth(KeycloakUserCredentials);
}

KeycloakClient.getClient = function(){
	return kcAdminClient;
}

KeycloakClient.getStatus = function(){
	return keycloakStatus;
}

KeycloakClient.createWebhook = function(){
	let accessToken = kcAdminClient.getAccessToken();

	logger.info('AccesToken: ' + accessToken);

	options.headers.Authorization = 'Bearer ' + accessToken;
	options.body = {
	  "enabled": "true",
	  "url": config.api.webhookPath,
	  "secret": config.api.webhookSecret,
	  "eventTypes": [
	    "*"
	  ]
	};

	request(options, function(error, response, body){
		try{
			if (!error && response.statusCode == 200) {
				logger.info(JSON.stringify(response));
				callback(null);
			}
			else {
				logger.info(JSON.stringify(response), JSON.stringify(body));
				callback({ message: 'Error on SSO webhook Initialization', error: error});
			}
		}catch(e){
			logger.info('online');
			logger.info(JSON.stringify(e));
			callback({ message: 'EXCEPTION on SSO webhook Initialization', error: e});
		}
	});
}

module.exports = KeycloakClient;