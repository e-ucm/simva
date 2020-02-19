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

			let options = this.cloneOptions();
			options.url += url;
			options.method = 'GET';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.get(options, function(error, response, body){
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

			let options = this.cloneOptions();
			options.body = JSON.stringify({title: name});
			options.url += '/games/bundle';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.post(options, function(error, response, body){
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
	 * Delete class by identifier
	 * @param classid 
	 */
	async deleteGame(gameId) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.deleteGame -> Started");

			let options = this.cloneOptions();
			options.url += '/games/' + gameId;
			options.method = 'DELETE';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.deleteGame -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				}else{
					self.Log('AnalyticsBackendController.deleteGame -> Error deleting the game');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error deleting the game', error: error });  
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

			let options = this.cloneOptions();
			options.url += '/games/' + gameId + "/versions";
			options.method = "GET";
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
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
					self.Log('AnalyticsBackendController.getVersions -> Error obtaining the versions');
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

			let options = this.cloneOptions();
			options.body = JSON.stringify({name: name});
			options.url += '/classes';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request.post(options, function(error, response, body){
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
	async deleteClass(classId) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.deleteClass -> Started");

			let options = this.cloneOptions();
			options.url += '/classes/' + classId;
			options.method = 'DELETE';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
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
	async addUsersToClass(classId, users) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.addUsersToClass -> Started");

			let options = this.cloneOptions();
			options.url += "/classes/" + classId;
			options.method = 'PUT';
			options.body = JSON.stringify({students: this.arrayToLower(users)});
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.addUsersToClass -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.addUsersToClass -> error adding users to class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to add users to the class', error: error });  
				}
			});
		});
	}

	/**
	 * Add users
	 * @param users 
	 */
	async removeUsersFromClass(classId, users) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.removeUsersFromClass -> Started");

			let options = this.cloneOptions();
			options.url += "/classes/" + classId + '/remove';
			options.method = 'PUT';
			options.body = JSON.stringify({students: this.arrayToLower(users)});
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.removeUsersFromClass -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.removeUsersFromClass -> error removing users from class');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to remove users from the class', error: error });  
				}
			});
		});
	}

	/**
	 * Creates an Activity in backend
	 * @param  {string}   name          Name for the activity to be created
	 * @param  {string}   gameId        ID of the game that will be assigned to the class when creating the activity
	 * @param  {string}   versionId     ID of the version of the game
	 * @param  {string}   classId       ID of the class to be assigned
	 * @return {object}                 Activity created or error if so.
	 */
	async addActivity(name, gameId, versionId, classId){
    	return new Promise((resolve, reject) => {
    		let self = this;
			this.Log("AnalyticsBackendController.createActivity -> Started");

			let activitybody = {
				name: name,
				gameId: gameId,
				versionId: versionId,
				classId: classId,
                offline: false
			} 

			let options = this.cloneOptions();
			options.url += "/activities/bundle";
			options.method = 'POST';
			options.body = JSON.stringify(activitybody);
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.createActivity -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.createActivity -> error');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to create the activity', error: error });  
				}
	        });
	    });
    };

    /**
     * Starts an activity. By default all activities are stopped and this is needed to start collecting data
     * @param  {string}   activityId The ID of the activity to be started.
     * @return {object}              Null or error if so.
     */
    async startActivity(activityId){
    	return new Promise((resolve, reject) => {
    		let self = this;
			this.Log("AnalyticsBackendController.startActivity -> Started");

			let options = this.cloneOptions();
			options.url += '/activities/' + activityId + '/event/start';
			options.method = 'POST';
			options.body = JSON.stringify({});
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.startActivity -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.startActivity -> error');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to start the activity', error: error });  
				}
	        });
	    });
    };

    /**
     * Starts an activity. By default all activities are stopped and this is needed to start collecting data
     * @param  {string}   activityId The ID of the activity to be started.
     * @return {object}              Null or error if so.
     */
    async endActivity(activityId){
    	return new Promise((resolve, reject) => {
    		let self = this;
			this.Log("AnalyticsBackendController.startActivity -> Started");

			let options = this.cloneOptions();
			options.url += '/activities/' + activityId + '/event/end';
			options.method = 'POST';
			options.body = JSON.stringify({});
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.startActivity -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				} else {
					self.Log('AnalyticsBackendController.startActivity -> error');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error trying to start the activity', error: error });  
				}
	        });
	    });
    };

    /**
	 * Delete class by identifier
	 * @param classid 
	 */
	async deleteActivity(activityId) {
		return new Promise((resolve, reject) => {
			let self = this;
			this.Log("AnalyticsBackendController.deleteActivity -> Started");

			let options = this.cloneOptions();
			options.url += '/activities/' + activityId;
			options.method = 'DELETE';
			options.headers['Authorization'] = 'Bearer ' + this.AuthToken;

			request(options, function(error, response, body){
				if(!error && response.statusCode == 200){
					try{
						let parsedbody = JSON.parse(body);
						self.Log('AnalyticsBackendController.deleteActivity -> Completed');
						resolve(parsedbody);
					}catch(e){
						reject({ message: 'Malformed body received from Backend'})
					}
				}else{
					self.Log('AnalyticsBackendController.deleteActivity -> Error deleting the activity');
					self.LogMultiple({error: error, response: response, body: body});
					reject({ message: 'Error deleting the game', error: error });  
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