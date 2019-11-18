const ServerError = require('./error');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

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

UsersController.authUser = async (username, plainPass) => {
	var users = await UsersController.getUsers({'username': username});

	if(users.length !== 1){
		throw { message: 'Username not found' };
	}
	try{
		let user = users[0];
		let success = await comparePassword(plainPass, user.password);
		if(success){
			let token = await UsersController.generateJWT(user);
			return { token: token };
		}else{
			throw({ message: 'Username or password not correct'});
		}
	}catch(e){
		console.log(e);
	}
	
}


var cryptPassword = async (password) => {
	return new Promise((resolve, reject) => {
		try{
		bcrypt.genSalt(10, function(err, salt) {
			if (err) 
				return reject(err);

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
	console.log(user);
	return jwt.sign(
		{
			data: {
				id: user._id,
				username: user.username,
				email: user.email
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
		let decoded = jwt.decode(token);

		if(decoded && decoded.iss){
			switch(decoded.iss){
				case 'simva':
				default:
					jwt.verify(token, secretKey, function(err, decoded) {
						if(err){
							reject('Token is not valid.');
						}else{
							resolve(decoded);
						}
					});		
			}
		}else{
			reject('Unable to decode token.');
		}

		/*jwt.verify(token, cert, function(err, decoded) {
			console.log(decoded.foo) // bar
		});*/
	});
	
}


module.exports = UsersController;