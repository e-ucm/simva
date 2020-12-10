const ServerError = require('./error');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
const KeycloakKeyManager = require('./utils/keycloakkeymanager');
const KeycloakClient = require('./utils/keycloakclient');
const jwt = require('jsonwebtoken');

var config = require('./config');

let UsersController = {};

UsersController.getUser = async (id) => {
	var res = await mongoose.model('user').find({_id: id});

	if(res.length > 0) {
		return res[0];
	}else{
		return null;
	}
};

UsersController.getUsers = async (params) => {
	var res = await mongoose.model('user').find(params);

	return res;
};

UsersController.addUser = async (params) => {
	var User = mongoose.model('user');

	try{
		params.password = await cryptPassword(params.password);
	}catch(e){
		console.log(e);
	}
	
	params.username = params.username.toLowerCase();
	let user = new User(params);

	await user.save();

	return user;
}

UsersController.addUserToKeycloak = async (params) => {
	if(!config.sso.enabled){
		return true;
	}

	console.log('KeyCloak -> Auth');

	await KeycloakClient.getClient().auth(KeycloakUserCredentials);

	console.log('KeyCloak -> Adding user');

	let user;
	try{
		user = await KeycloakClient.getClient().users.create({
			/*realm: config.sso.realm,*/
			username: params.username.toLowerCase(),
			email: params.email,
			enabled: true
		});
	}catch(e){
		console.log(e);
		throw { message: 'Failed creating the user into keycloak' };
	}

	console.log('KeyCloak -> getting Role Mappings');
	let roleMappings = await KeycloakClient.getClient().users.listAvailableRealmRoleMappings({id: user.id});

	let selectedRole;
	for (var i = roleMappings.length - 1; i >= 0; i--) {
		if(roleMappings[i].name === params.role){
			selectedRole = roleMappings[i];
			break;
		}
	}

	console.log('KeyCloak -> Adding Role to User');
	let result = await KeycloakClient.getClient().users.addRealmRoleMappings({id: user.id, roles: [{id: selectedRole.id, name: selectedRole.name}]});

	console.log('KeyCloak -> Setting up User Password');
	await KeycloakClient.getClient().users.resetPassword({
		id: user.id,
		credential: {
			temporary: false,
			type: 'password',
			value: params.password,
		}
	});

	/* 
		DISABLED BECAUSE IT MIGHT NOT BE NECESSARY
	

	console.log('KeyCloak -> Obtaining user to enable it');
	user = await KeycloakClient.getClient().users.findOne({
      id: user.id,
    });

    user.requiredActions = [];
    user.enabled = true;

	console.log('KeyCloak -> Enabling the user and removing pass edit request for it to be able to login');
    await KeycloakClient.getClient().users.update({id: user.Id}, { enabled: true });*/

    console.log('KeyCloak -> User Added to Keycloak!');
	return true;
}

UsersController.updateUser = async (id, params) => {
	let result =  await mongoose.model('user').updateOne({ _id: id }, params);

	if(result.ok !== result.n){
		throw {message: 'There was an error in the study.'};
	}

	return params;
}

UsersController.authUser = async (username, plainPass) => {
	var users = await UsersController.getUsers({ 'username': username.toLowerCase() });

	if(users.length !== 1){
		throw { message: 'Username not found' };
	}
	let user = users[0];
	let success = await comparePassword(plainPass, user.password);
	if(success){
		let token = await UsersController.generateJWT(user);
		return { token: token };
	}else{
		throw({ message: 'Username or password not correct'});
	}
	
}


var cryptPassword = async (password) => {
	return new Promise((resolve, reject) => {
		try{
			bcrypt.genSalt(10, function(err, salt) {
				if (err) {
					return reject(err);
				}

				bcrypt.hash(password, salt, function(err, hash) {
					if(err){
						reject(err);
					}else{
						resolve(hash);
					}
				});
			});
		}catch(e){
			console.log(e);
		}
	});
};

var comparePassword = async (plainPass, hashword) => {
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {
			if(err){
				reject(err);
			}else{
				resolve(isPasswordMatch);
			}
		});
	});
}



UsersController.generateJWT = async (user) => {
	return jwt.sign(
		{
			data: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role
			}
		},
		config.JWT.secret,
		{
			expiresIn: config.JWT.expiresIn,
			issuer: config.JWT.issuer
		}
	);
}

UsersController.validateJWT = async (token) => {
	return new Promise((resolve, reject) => {
		let decoded = jwt.decode(token, { complete: true });

		if(!decoded || !decoded.header || !decoded.header.alg || !decoded.header.alg.toLowerCase() === 'none'){
			return reject({ message: 'JWT not valid or unsupported signing algoritm' });
		}

		if(decoded && decoded.header && decoded.payload && decoded.payload.iss){
			switch(decoded.payload.iss){
				case config.sso.realmUrl:
					if(!config.sso.enabled){
						throw { message: 'SSO is disabled, no JWT from sso will be accepted.' }
					}

					let ValidateToken = function(){
						KeycloakKeyManager.getKey(decoded.header.kid)
							.then((publicKey) => {
								jwt.verify(token, publicKey, function(error, decoded) {
									if(error){
										reject(error);
									}else{
										UsersController.CreateOrUpdateKeycloakUser(decoded)
											.then((result) => {
												resolve(result);
											})
											.catch((error) => {
												reject(error);
											});
									}
								});
							})
							.catch((error) => {
								reject(error);
							});
					}

					KeycloakKeyManager.checkKey(decoded.header.kid, token)
						.then(() => {
							ValidateToken();
						})
						.catch((error) => {
							console.log('FAILED VALIDATION');
							KeycloakKeyManager.reloadKey(decoded.header.kid)
								.then((publicKey) => {
									ValidateToken();
								})
								.catch((error) => {
									console.log(error);
									reject(error);
								})
						})
					

					break;
				case 'simva':
				default:
					jwt.verify(token, config.JWT.secret, function(err, decoded) {
						if(err){
							console.log(JSON.stringify(err));
							reject('Token is not valid.');
						}else{
							resolve(decoded);
						}
					});	
					break;	
			}
		}else{
			reject('Unable to decode token.');
		}
	});
	
}

UsersController.CreateOrUpdateKeycloakUser = async function (decoded){
	return new Promise((resolve, reject) => {
		if(!config.sso.enabled){
			resolve(decoded);
		}

		UsersController.getUsers({ email: decoded.email })
			.then((users) => {
				if(users.length !== 0){
					if(users[0].role !== UsersController.getRoleFromJWT(decoded)){
						users[0].role = UsersController.getRoleFromJWT(decoded);
						UsersController.updateUser(users[0]._id, users[0])
							.then((result) => {
								resolve(UsersController.simplifyUser(result));
							})
							.catch((error) => {
								console.log(error);
								reject(error);
							})
					}else{
						resolve(UsersController.simplifyUser(users[0]))
					}
				}else{
					UsersController.createUserFromJWT(decoded)
						.then((result) => {
							resolve(UsersController.simplifyUser(result));
						})
						.catch((error) => {
							console.log(error);
							reject(error);
						})
				}
			})
			.catch((error) => {
				console.log(error);
				reject(error);
			});
	});
}

UsersController.simplifyUser = function(user){
	return { data: {
		_id: user._id,
		username: user.username,
		email: user.email,
		role: user.role
	}}
}

UsersController.createUserFromJWT = async function(decoded){
	let user = {
		username: decoded.preferred_username,
		password: Math.random().toString(36).slice(-8),
		email: decoded.email,
		role: 'student'
	};

	user.role = UsersController.getRoleFromJWT(decoded);

	return await UsersController.addUser(user);
}

UsersController.getRoleFromJWT = function(decoded){
	let role = 'student';

	for (var i = decoded.realm_access.roles.length - 1; i >= 0; i--) {
		if(decoded.realm_access.roles[i] === 'teacher' || decoded.realm_access.roles[i] === 'researcher'){
			role = 'teacher';
			break;
		};
	}

	return role;
}


module.exports = UsersController;