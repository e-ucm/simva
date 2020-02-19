/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var request = require('request');
var async = require('async');
var session_timestamp;
var AUTH_TOKEN = "";
var options = {};
var user = "", pass = "";
var debug = true;

function setOptions(_options){
	options = _options;
	options = cloneOptions();
}

function setUser(username,password){
	user = username;
	pass = password;
}

function setDebug(_debug){
	debug = _debug;
}

function Log(line){
	if(debug){
		let log = line;
		if(typeof line === 'object'){
			log = JSON.stringify(line, null, 2);
		}
		console.info('\x1b[35m%s\x1b[0m', log);
	}
}

function LogMultiple(lines){
	var keys = Object.keys(lines);
	for (var i = 0; i < keys.length; i++) {
		Log('--> ' + keys[i] + ':');
		Log(lines[keys[i]]);
	}
}

function LogBigError(name, error, callback){
	Log('A2Controller.' + name + ' -> ERROR:');
	Log(error);
	callback(error);
}

function auth(callback) {
	Log('A2Controller.Auth -> Started');
	try{
		if(!AUTH_TOKEN){
			update_auth_token(callback);
		}else if(Math.round(new Date().getTime()/1000) - session_timestamp > 300){
			Log('A2Controller.Auth -> Auth token expired, requesting new.');
			reauth(callback);
		}else{
			Log('A2Controller.Auth -> Completed');
			callback(null);
		}
	}catch(e){
		LogBigError('auth', e, callback);
	}
}

function reauth(callback) {
	Log('A2Controller.reauth -> Started');
	try{
		async.waterfall([
			release_session_token,
			update_auth_token
		], function (err, result) {
			Log('A2Controller.reauth -> Completed');
			callback(null);
		});
	}catch(e){
		LogBigError('reauth', e, callback);
	}
}

function release_session_token(callback){
	Log('A2Controller.reauth -> Started');
	AUTH_TOKEN = "";
}


function update_auth_token(callback){
	Log('A2Controller.update_auth_token -> Started');
	try{
		login(user, pass, function(error, user){
			if(error){
				Log('A2Controller.update_auth_token -> Error');
				LogMultiple({error: error, response: response, body: body});
				callback({ message: 'Error trying to auth'});
			}else{
				Log('A2Controller.update_auth_token -> New key: ' + user.token);

				AUTH_TOKEN = user.token;
				options.headers['Authorization'] = 'Bearer ' + user.token;
				session_timestamp = Math.round(new Date().getTime()/1000);

				Log('A2Controller.update_auth_token -> Completed');
				callback(null);
			}
		});
	}catch(e){
		LogBigError('update_auth_token', e, callback);
	}
}

function login(username, password, callback){
	Log('A2Controller.login -> Started');
	try{
		this.options = cloneOptions();
		this.options.url += "/login";
		this.options.body = JSON.stringify({ username: user, password: pass});
		this.options.method = "POST";

		request(this.options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);

				Log('A2Controller.login -> Completed');
				callback(null, body.user);
			}else{
				Log('A2Controller.login -> error on auth');
				LogMultiple({error: error, response: response, body: body});
				callback({ message: 'Error trying to auth', error: error });  
			}
		});
	}catch(e){
		LogBigError('login', e, callback);
	}
}

/**
 * Sign up multiple users
 * @param codes 
 */
function signup(user) {
	return function (callback) {
		Log('A2Controller.signup -> Started');
		try{
			this.options = cloneOptions();
			this.options.url += "/signup";
			this.options.body = JSON.stringify(user);
			this.options.method = "POST";

			request.post(this.options, function(error, response, body){
				if(error){
					Log('A2Controller.signup -> Error');
					Log(error);
					callback({ message: 'Error creating the user', error: error });
				}else{
					Log('A2Controller.signup -> Completed');
					callback(null);
				}
			});
		}catch(e){
			LogBigError('signup', e, callback);
		}
	}
}

/**
 * Sign up multiple users
 * @param codes 
 */
function signupMassive(participants) {
	return function (callback) {
		Log('A2Controller.signupMassive -> Started');
		try{
			var users = [];
			for (let i = 0; i < participants.length; i++){
				users.push({username: participants[i], password: participants[i], email: participants[i] + "@simva.test", role: "student", prefix: "gleaner"});
			}

			this.options = cloneOptions();
			this.options.url += "/signup/massive";
			this.options.body = JSON.stringify({users: users});
			this.options.method = "POST";

			request.post(this.options, function(error, response, body){
				if(error){
					Log('A2Controller.signupMassive -> Error');
					Log(error);
					callback({ message: 'Error adding the participants', error: error });
				}else{
					Log('A2Controller.signupMassive -> Completed');
					callback(null);
				}
			});
		}catch(e){
			LogBigError('signupMassive', e, callback);
		}
	}
}

/**
 * Sign up multiple users
 * @param codes 
 */
function getUsers(participants) {
	return function (callback) {
		Log('A2Controller.getUsers -> Started');
		try{
			let query = JSON.stringify({
				username: participants
			});

			this.options = cloneOptions();
			this.options.url += "/users?limit=" + participants.length + '&query=' + encodeURI(query);
			this.options.method = "GET";

			request.get(this.options, function(error, response, body){
				if(error){
					Log('A2Controller.getUsers -> Error');
					Log(error);
					callback({ message: 'Error obtaining the users', error: error });
				}else{
					try{
						Log('A2Controller.getUsers -> Completed');
						let parsedbody = JSON.parse(body);
						callback(null, parsedbody);
					}catch(e){
						LogMultiple({error: error, response: response, body: body});
						callback({ message: 'Malformed body received from A2.' });
					}
				}
			});
		}catch(e){
			LogBigError('getUsers', e, callback);
		}
	}
}

function cloneOptions(){
	return JSON.parse(JSON.stringify(options));
}

module.exports = {
	setOptions: setOptions,
	setUser: setUser,
	auth: auth,
	signup: signup,
	signupMassive: signupMassive,
	getUsers: getUsers
}