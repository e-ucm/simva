const ServerError = require('./error');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
const KeycloakKeyManager = require('./utils/keycloakkeymanager');
const jwt = require('jsonwebtoken');
 
var config = require('./config');

var UsersController = {};

var secretKey = 'th1s_15_a_tmporall7_k3y';

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

UsersController.updateUser = async (id, params) => {
	let result =  await mongoose.model('user').updateOne({ _id: id }, params);

	if(result.ok !== result.n){
		throw {message: 'There was an error in the study.'};
	}

	return params;
}

UsersController.authUser = async (username, plainPass) => {
	var users = await UsersController.getUsers({'username': username});

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
		secretKey,
		{
			expiresIn: '24h',
			issuer: 'simva'
		}
	);
}

UsersController.validateJWT = async (token) => {
	return new Promise((resolve, reject) => {
		let decoded = jwt.decode(token, { complete: true });

		if(decoded && decoded.header && decoded.payload && decoded.payload.iss){
			switch(decoded.payload.iss){
				case config.sso.realmUrl:
					let ValidateToken = function(){
						KeycloakKeyManager.getKey(decoded.header.kid)
							.then((publicKey) => {
								jwt.verify(token, publicKey, function(error, decoded) {
									if(error){
										console.log(error);
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
								console.log(error);
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
					jwt.verify(token, secretKey, function(err, decoded) {
						if(err){
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
		UsersController.getUsers({ email: decoded.email })
			.then((users) => {
				if(users.length !== 0){
					if(users[0].role !== UsersController.getRoleFromJWT(decoded)){
						UsersController.updateUser()
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
					createUserFromJWT(decoded)
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