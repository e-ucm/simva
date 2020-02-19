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

class AnalyticsBackendController {

	// ###############################################
	// ############# LOG GENERATION UTIL #############
	// ###############################################
	
	constructor(_debug){
		if(_debug == null || _debug == undefined){
			this.setDebug(true);
		}else{
			this.setDebug(false);
		}
	}

	setDebug(_debug){
		this.debug = _debug;
	}

	Log(line){
		if(this.debug){
			let log = line;
			if(typeof line === 'object'){
				log = JSON.stringify(line, null, 2);
			}
			console.info('\x1b[31m%s\x1b[0m', log);
		}
	}

	LogMultiple(lines){
		var keys = Object.keys(lines);
		for (var i = 0; i < keys.length; i++) {
			this.Log('--> ' + keys[i] + ':');
			this.Log(lines[keys[i]]);
		}
	}

	LogBigError(name, error, callback){
		this.Log('AnalyticsBackendController.' + name + ' -> ERROR:');
		this.Log(error);
		callback(error);
	}

	// ###############################################

	set Options(_options){
		this.options = _options;
		this.options = this.cloneOptions();
	}

	set AuthToken(_auth_token){
		this.auth_token = _auth_token;
	}

	get AuthToken(){
		return this.auth_token;
	}

	async loadPublicGames(games) {
		return await this.loadGames('/games/public');
	}

	async loadAllGames(games) {
		return await this.loadGames('/games')
	}

	async loadGames(url) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.loadGames -> Started");

			this.options = this.cloneOptions();
			this.options.url += url;
			this.options.method = 'GET';
			this.options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.get(this.options, function(error, response, body){
				if (!error && response.statusCode == 200) {
					try{
						body = JSON.parse(body);
						for(var i in body){
							games.push(body[i]);
						}

						self.Log("AnalyticsBackendController.loadGames -> Completed");
						resolve(body);
					}catch(e){
						self.Log("AnalyticsBackendController.loadGames -> Error");
						reject({ message: 'Malformed body received from backend' });
					}
				}else{
					self.Log('AnalyticsBackendController.loadGames -> Error creating the class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error creating the game', error: error });  
				}
			});
		});
	}

	async addGame(name){
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.addGame -> Started");

			this.options = this.cloneOptions();
			this.options.body = JSON.stringify({title: name});
			this.options.url += '/games/bundle';
			this.options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.post(this.options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);

						self.Log("AnalyticsBackendController.addGame -> Completed");
						resolve(parsedbody);
					}catch(e){
						console.log("AnalyticsBackendController.addGame -> Error: Malformed body");
						reject({ message: 'Malformed body received from Analytics Backend' });
					}
				}else{
					self.Log('AnalyticsBackendController.addGame -> Error creating the class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error creating the game', error: error });  
				}
			});
		});
	}

	/**
	 * Get game versions
	 * @param game 
	 */
	async getVersions(gameId) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.getVersions -> Started");

			this.options = this.cloneOptions();
			this.options.url += '/games/' + gameId + "/versions";
			this.options.method = "GET";
			this.options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(this.options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);

						self.Log("AnalyticsBackendController.getVersions -> Completed");
						resolve(parsedbody);
					}catch(e){
						self.Log("AnalyticsBackendController.getVersions -> Error");
						reject({ message: 'Malformed body received from Analytics Backend' });
					}
				}else{
					self.Log('AnalyticsBackendController.getVersions -> Error creating the class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error error obtaining the versions of the game', error: error });  
				}
			});
		});
	}

	/**
	 * Create class by name
	 * @param name 
	 */
	async addClass(name) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.createClass -> Started");

			this.options = this.cloneOptions();
			this.options.body = JSON.stringify({name: name});
			this.options.url += '/classes';
			this.options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.post(this.options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);
						self.Log("AnalyticsBackendController.createClass -> Completed");
						resolve(parsedbody);
					}catch(e){
						console.log("AnalyticsBackendController.createClass -> Error: Malformed body");
						reject({ message: 'Malformed body received from Analytics Backend' });
					}
				}else{
					self.Log('AnalyticsBackendController.createClass -> Error creating the class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error creating the class', error: error });  
				}
			});
		});
	}

	/**
	 * Delete class by identifier
	 * @param classid 
	 */
	deleteClass(classId) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.deleteClass -> Started");

			this.options = cloneOptions();
			this.options.url += '/classes/' + classId;
			this.options.method = 'DELETE';

			request(this.options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.deleteClass -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				}else{
					self.Log('AnalyticsBackendController.deleteClass -> Error deleting the class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error deleting the class', error: error });  
				}
			});
		});
	}

	/**
	 * Add users
	 * @param users 
	 */
	addUsers(classId, users) {
		return new Promise((classroom, callback) => {
			let self = this;
			this.Log("AnalyticsBackendController.addUsers -> Started");
			this.options = cloneOptions();
			this.options.url += "/classes/" + classroom._id;
			this.options.method = 'PUT';
			this.options.body = JSON.stringify({students: this.arrayToLower(users)});

			request(this.options, function(error, response, body){
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.addUsers -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.addUsers -> error on auth');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to add users to the class', error: error });  
				}
			});
		});
	}

	arrayToLower(a){
		var r = [];
		for(var i in a){
			r.push(a[i].toLowerCase());
		}
		return r;
	}


	cloneOptions(){
		return JSON.parse(JSON.stringify(this.options));
	}
}

module.exports = AnalyticsBackendController;