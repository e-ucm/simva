const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

console.log(KcAdminClient);
 
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

console.log('----- KEYCLOAK -----');
console.log('Keycloak-> Connecting to: ');
console.log(JSON.stringify(kcconfig, null, 2));
console.log('Keycloak-> Authentication: ');
console.log(JSON.stringify(KeycloakUserCredentials, null, 2));
console.log('--------------------');

let keycloakStatus = false;
if(config.sso.enabled){
	kcAdminClient.auth(KeycloakUserCredentials)
	.then((result) => {
		console.log(kcAdminClient.getAccessToken());
		console.log('Connected to Keycloak!');
		keycloakStatus = true;
	})
	.catch((error) => {
		console.log('Unable to connect to keycloak');
		console.info(error);
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

	console.log('AccesToken: ' + accessToken);

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
				console.log(JSON.stringify(response));
				callback(null);
			}
			else {
				console.log(JSON.stringify(response), JSON.stringify(body));
				callback({ message: 'Error on SSO webhook Initialization', error: error});
			}
		}catch(e){
			console.log('online');
			console.log(JSON.stringify(e));
			callback({ message: 'EXCEPTION on SSO webhook Initialization', error: e});
		}
	});
}

module.exports = KeycloakClient;