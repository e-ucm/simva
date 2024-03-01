const KeyCloakCerts = require('keycloak-public-key');
const jwt = require('jsonwebtoken');
var config = require('../config');


var KeycloakKeyManager = {};

const keyCloakCerts = new KeyCloakCerts(config.sso.url, config.sso.realm);

let LoadedKeys = {};

KeycloakKeyManager.getKey = async function(kid){
	try{
		if(!LoadedKeys.hasOwnProperty(kid)){
			LoadedKeys[kid] = await KeycloakKeyManager.reloadKey(kid);
			KeycloakKeyManager.Log('### KeycloakKeyManager.getKey -> got key: ' + LoadedKeys[kid]);
		}
	}catch(e){
		KeycloakKeyManager.Log('### KeycloakKeyManager.getKey -> catch: ' + JSON.stringify(e));
		KeycloakKeyManager.Log(e)
	}

	return LoadedKeys[kid];
}

KeycloakKeyManager.checkKey = async function(kid, token){
	return new Promise((resolve, reject) => {
		try{
			KeycloakKeyManager.Log('### KeycloakKeyManager.checkKey -> pre-getKey(' + kid + ')');
			KeycloakKeyManager.getKey(kid)
				.then((privateKey) => {
					KeycloakKeyManager.Log('### KeycloakKeyManager.checkKey -> pre-jwtverify('+token+',' + privateKey + ')');
					jwt.verify(token, privateKey, function(error, decoded) {
						if(error && error.message === 'invalid algorithm'){
							KeycloakKeyManager.Log('### KeycloakKeyManager.checkKey -> ERROR: Not valid signature');
							reject('Not valid signature');
						}else{
							KeycloakKeyManager.Log('### KeycloakKeyManager.checkKey -> SUCCESS!');
							resolve();
						}
					});
				})
				.catch((error) => {
					KeycloakKeyManager.Log('### KeycloakKeyManager.checkKey -> error catch: ' + JSON.stringify(error));
					reject(error);
				})
		}catch(e){
			KeycloakKeyManager.Log(e)
			reject(e);
		}
	});
}

KeycloakKeyManager.reloadKey = async function(kid){
	return new Promise((resolve, reject) => {
		KeycloakKeyManager.Log('######### RELOADING KEYCLOAK KEY ' + kid + ' #########');
		try{
			KeycloakKeyManager.Log('### KeycloakKeyManager.reloadKey -> pre-fetch');
			keyCloakCerts.fetch(kid)
				.then((publicKey) => {
					KeycloakKeyManager.Log('### KeycloakKeyManager.reloadKey -> got public key: ' + publicKey);
					resolve(publicKey);
				})
				.catch((error) => {
					KeycloakKeyManager.Log('### KeycloakKeyManager.reloadKey -> Error: ' + JSON.stringify(error));
					reject(error);
				})
		}catch(e){
			KeycloakKeyManager.Log('### KeycloakKeyManager.reloadKey -> catch: ' + JSON.stringify(e));
			reject(e);
		}
	})
}

KeycloakKeyManager.Log = function(message){
	if(config.sso.loggerActive){
		console.log(message);
	}
}

module.exports = KeycloakKeyManager;