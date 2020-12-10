const KcAdminClient = require('keycloak-admin').default;

console.log(KcAdminClient);
 
var config = require('../config');

var KeycloakClient = {};

let kcconfig = {
	baseUrl: config.sso.url + '/auth',
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
		console.log('Connected to Keycloak!');
		keycloakStatus = true;
	})
	.catch((error) => {
		console.log('unable to connect to keycloak');
		console.info(error);
		keycloakStatus = false;
	});
}

KeycloakClient.getClient = function(){
	return kcAdminClient;
}

KeycloakClient.getStatus = function(){
	return keycloakStatus;
}