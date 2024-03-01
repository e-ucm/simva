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
		}
	}catch(e){
		console.log(e)
	}

	return LoadedKeys[kid];
}

KeycloakKeyManager.checkKey = async function(kid, token){
	return new Promise((resolve, reject) => {
		try{
			KeycloakKeyManager.getKey(kid)
				.then((privateKey) => {
					jwt.verify(token, privateKey, function(error, decoded) {
						if(error && error.message === 'invalid algorithm'){
							reject('Not valid signature');
						}else{
							resolve();
						}
					});
				})
				.catch((error) => {
					reject(error);
				})
		}catch(e){
			console.log(e)
			reject(e);
		}
	});
}

KeycloakKeyManager.reloadKey = async function(kid){
	return new Promise((resolve, reject) => {
		console.log('######### RELOADING KEYCLOAK KEY ' + kid + ' #########');
		try{
			keyCloakCerts.fetch(kid)
				.then((publicKey) => {
					resolve(publicKey);
				})
				.catch((error) => {
					reject(error);
				})
		}catch(e){
			console.log(e)
			reject(e);
		}
	})
}

module.exports = KeycloakKeyManager;