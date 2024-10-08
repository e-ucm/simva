/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const logger = require('../../logger');
var axios= require('axios')
var async = require('async');
var session_timestamp;
var SESSIONKEY = '';
var options = {};
var user, pass;
var debug = true;

function setOptions(_options){
	options = _options;
}

function setUser(_user,_pass){
	user = _user;
	pass = _pass;
}

function setDebug(_debug){
	debug = _debug;
}

function Log(line){
	if(debug){
		logger.info('\x1b[32m%s\x1b[0m', line);
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
	Log('LimesurveyController.' + name + ' -> ERROR:');
	Log(error);
	callback(error);
}

function NotifyRCError(name, error, response, body, callback){
	Log('LimesurveyController.' + name + ' -> Error parsing body');
	LogMultiple({error: error});
	Log('LimesurveyController.' + name + ' -> Probably RemoteControl'
		+ ' API is not configured, check '
		+ 'https://manual.limesurvey.org/RemoteControl_2_API#How_to_configure_LSRC2');
	callback({message: 'Error on parsing body. Is LSRC2 configured?'});
}

/**
 * Create survey
 * @param survey
 */
function create(survey) {
	Log('LimesurveyController.create -> Started');
	
	return function (callback) {
		try{
			if(survey){
				async.waterfall([
					auth,
					insert(survey),
					start,
					startTokensSurvey
				], function (err, result) {
					if(err){
						Log('LimesurveyController.create -> ERROR');
						return callback({ message: 'Error creating the survey', error: err})
					}else{
						Log('LimesurveyController.create -> Completed');
						callback(null, result);
					}
				});
			}
		}catch(e){
			LogBigError('create', e, callback);
		}
	}
}

/**
 * Clone survey
 * @param survey
 */
function clone(surveyId) {
	return function (callback) {
		Log('LimesurveyController.clone -> Started');
		try{
			async.waterfall([
				auth,
				copy(surveyId),
				start,
				startTokensSurvey
			], function (err, result) {
				if(err){
					Log('LimesurveyController.clone -> ERROR');
					return callback({ message: 'Error cloning the survey', error: err})
				}else{
					Log('LimesurveyController.clone -> Completed');
					callback(null, result);
				}
			});
		}catch(e){
			LogBigError('clone', e, callback);
		}
	}
}

function online(callback){
	Log('LimesurveyController.online -> Started');
	options.data = {};
	try{
		axios(options).then(response => {
			logger.info('Limesurvey ONLINE')
			callback(null);
		}).catch(error => {
			Log('LimesurveyController.online -> Unable to reach service')
			LogMultiple({error: error});
			callback({ message: 'LimeSurvey service unreachable.', error: error});
		})
	}catch(e){
		LogBigError('online', e, callback);
	}
}

function auth(callback) {
	Log('LimesurveyController.auth -> Started');
	if(!SESSIONKEY){
		Log('LimesurveyController.auth -> No session key, updating auth token.');
		update_auth_token(callback);
	}else if(Math.round(new Date().getTime()/1000) - session_timestamp > 300){
		//TODO: check if the session is still active
		Log('LimesurveyController.auth -> Auth token expired, requesting new.');
		reauth(callback);
	}else{
		Log('LimesurveyController.auth -> Completed');
		callback(null);
	}
}

function reauth(callback) {
	Log('LimesurveyController.reauth -> Started');
	try{
		async.waterfall([
			release_session_token,
			update_auth_token
		], function (err, result) {
			Log('LimesurveyController.reauth -> Completed');
			callback(null);
		});
	}catch(e){
		LogBigError('reauth', e, callback);
	}
}

function release_session_token(callback){
	Log('LimesurveyController.release_session_token -> Started');
	options.data = {method:'release_session_key',params:[SESSIONKEY],id:1};
	try{
		axios(options).then(response => {
			let body;
		  	try{
				body = response.data;
			}catch(error){
				return NotifyRCError('release_session_token', error, response, body, callback);
			}
			Log('LimesurveyController.release_session_token -> Key released:');
			LogMultiple({result: body.result});
			callback(null);
		  }).catch(error => {
		  	Log('LimesurveyController.release_session_token -> ERROR:');
		  	LogMultiple({error: error});
		  	callback({ message: 'Error releasing session token', error: error });
		  });
	}catch(e){
		LogBigError('release_session_token', e, callback);
	}
}


function update_auth_token(callback){
	Log('LimesurveyController.update_auth_token -> Started');
	options.data = {method:'get_session_key',params:[user,pass],id:1};

	try{
		Log(JSON.stringify(options));
		axios(options).then(response => {
				let body;
				try{
					body = response.data;
				}catch(error){
					return NotifyRCError('update_auth_token', error, response, body, callback);
				}

				Log('LimesurveyController.update_auth_token -> New key: ' + body.result);

				SESSIONKEY = body.result;
				session_timestamp = Math.round(new Date().getTime()/1000);

				Log('LimesurveyController.update_auth_token -> Completed');
				callback(null);
			}).catch(error => {
				Log('LimesurveyController.update_auth_token -> error on auth');
				LogMultiple({error: error});
				callback({ message: 'Error trying to auth', error: error });
			});
	}catch(e){
		LogBigError('update_auth_token', e, callback);
	}
}

/**
 * Insert survey
 * @param survey
 */
function insert(survey) {
	return function(callback) {
		Log('LimesurveyController.insert -> Started');
		options.data = {method:'import_survey',params:[SESSIONKEY, survey, 'lss'],id:1};

		insertOrCopy('insert', options, callback);
	}
}

/**
 * Copy survey
 * @param survey
 */
function copy(surveyId, name) {
	return function(callback) {
		Log('LimesurveyController.copy -> Started');
		options.data = {
			method:'copy_survey',
			params:[SESSIONKEY, surveyId, name, ['copysurveyexcludepermissions','copysurveyresetstartenddate']],
			id:1
		};

		insertOrCopy('copy', options, callback);
	}
}

function insertOrCopy(name, options, callback){
	try{
		axios(options).then(response => {
			let body;
				try{
					body = response.data;
				}catch(error){
					return NotifyRCError(name, error, response, body, callback);
				}

				let surveyid = null;
				if(body && body.result){
					if(Number.isInteger(body.result)){
						surveyid = body.result;
					}else if(body.result.newsid){
						surveyid = body.result.newsid;
					}else{
						Log('LimesurveyController.' + name + ' -> Error');
						Log('LimesurveyController.' + name + ' -> Received Body:');
						Log(JSON.stringify(body));
						return callback({ message: 'Unable to obtain the new survey id from body.'});
					}
				}else{
					logger.info(body);
					Log('LimesurveyController.' + name + ' -> Error');
					return callback({ message: 'Malformed body received from LimeSurvey'});
				}

				Log('LimesurveyController.' + name + ' -> New Survey ID: ' + surveyid);
				Log('LimesurveyController.' + name + ' -> Completed');
			
				callback(null, surveyid);
			}).catch(error => {
				Log('LimesurveyController.' + name + ' -> error creating the survey');
				LogMultiple({error: error});
				callback({ message: 'Error trying to ' + name + ' the survey into LS', error: error });
			});
	}catch(e){
		LogBigError(name, e, callback);
	}
}

/**
 * Get survey by identifier
 * @param sid
 * @param survey 
 */
function getSurvey(sid,survey) {
	return function(callback) {
		try{
			Log('LimesurveyController.getSurvey -> Started');
			options.data = {method:'list_surveys',params:[SESSIONKEY],id:1};

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('getSurvey', error, response, body, callback);
					}

					for(i in body.result){
						if(body.result[i].sid == sid){
							survey[0] = body.result[i];
							break;
						}
					}
					if(!survey[0]){
						Log('LimesurveyController.getSurvey -> Survey not found');
						callback({ message: 'Survey not found in Limesurvey' });
					}else{
						Log('LimesurveyController.getSurvey -> Completed');
						callback(null, survey[0]);
					}
				}).catch(error => {
					Log('LimesurveyController.getSurvey -> error obtaining the list of surveys');
					LogMultiple({error: error});
					callback({ message: 'Error obtaining survey list from limesurvey', error: error });
				});
		}catch(e){
			LogBigError('getSurvey', e, callback);
		}
	}
}

/**
 * Get survey list
 * @param sid
 * @param survey 
 */
function getSurveyList(callback) {
	try{
		Log('LimesurveyController.getSurveyList -> Started');
		options.data = {method:'list_surveys',params:[SESSIONKEY],id:1};

		axios(options).then(response => {
			let body;
				try{
					body = response.data;
				}catch(error){
					return NotifyRCError('getSurveyList', error, response, body, callback);
				}

				callback(body.result);
			}).catch(error => {
				Log('LimesurveyController.getSurveyList -> error obtaining the list of surveys');
				LogMultiple({error: error});
				callback({ message: 'Error obtaining survey list from Limesurvey', error: error });
			});
	}catch(e){
		LogBigError('getSurveyList', e, callback);
	}
}

/**
 * Get survey list
 * @param sid
 * @param survey 
 */
function getSurveysFromUser(username) {
	return function(callback) {
		try{
			Log('LimesurveyController.getSurveyList -> Started');
			options.data = {method:'list_surveys',params:[SESSIONKEY, username],id:1};

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('getSurveysFromUser', error, response, body, callback);
					}

					callback(null, body.result);
				}).catch(error => {
					Log('LimesurveyController.getSurveysFromUser -> error obtaining the list of surveys');
					LogMultiple({error: error});
					callback({ message: 'Error obtaining survey list from Limesurvey', error: error });
				});
		}catch(e){
			LogBigError('getSurveysFromUser', e, callback);
		}
	}
}

/**
 * Start survery by identifier
 * @param surveyId 
 */
function start(surveyId, callback) {
	try{
		Log('LimesurveyController.start -> Started');
		options.data = { method: 'activate_survey', params: [SESSIONKEY, surveyId], id:1 };
		Log('LimesurveyController.start -> Starting survey: ' + surveyId);

		axios(options).then(response => {
			let body;
				try{
					body = response.data;
				}catch(error){
					return NotifyRCError('start', error, response, body, callback);
				}

				Log('LimesurveyController.start -> Survey started: ' + surveyId);
				callback(null, surveyId);
			}).catch(error => {
				Log('LimesurveyController.start -> error starting the survey');
				LogMultiple({error: error});
				callback({ message: 'Error starting the survey in LimeSurvey', error: error });
			});
	}catch(e){
		LogBigError('start', e, callback);
	}
}

/**
 * Remove survey by identifier
 * @param surveyId 
 */
function remove(surveyId) {
	return function(callback){
		try{
			Log('LimesurveyController.remove -> Started');
			options.data = { method: 'delete_survey', params: [SESSIONKEY, surveyId], id:1 };
			Log('LimesurveyController.remove -> Deleting: ' + surveyId);

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('remove', error, response, body, callback);
					}

					Log('LimesurveyController.remove -> deleted');
					callback(null);
				}).catch(error => {
					Log('LimesurveyController.remove -> error removing the survey');
					LogMultiple({ error: error });
					callback({ message: 'Error removing the survey from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('remove', e, callback);
		}
	}
}

/**
 * Check if survey is started
 * @param survey 
 */
function started(surveys){
	return function(callback){
		try{
			Log('LimesurveyController.started -> Started');

			let survey = surveys;
			if(Array.isArray(surveys)){
				survey = surveys[0];
			}
			
			if(survey.active === 'N'){
				Log('LimesurveyController.started -> Error');
				callback({ message: 'Survey is not active in LimeSurvey' });
			}else{
				Log('LimesurveyController.started -> completed');
				callback(null);
			}
		}catch(e){
			Log(e);
			callback({ message: 'Bad survey' });
		}
	}
}

/**
 * List participants of survey
 * @param survey
 * @param participants 
 */
function participants(survey, participants){
	return function(callback){
		try{
			Log('LimesurveyController.participants -> Started');
			options.data = { method: 'list_participants', params: [SESSIONKEY, survey], id:1 };

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('participants', error, response, body, callback);
					}

					logger.info(body);

					participants[0] = body.results;

					if(!participants[0]){
						Log('LimesurveyController.participants -> Survey not found');
						callback({ message: 'Survey not found in Limesurvey, either participants.' });
					}else{
						Log('LimesurveyController.participants -> Completed');
						callback(null, participants[0]);
					}
				}).catch(error => {
					Log('LimesurveyController.participants -> error obtaining the participants');
					LogMultiple({ error: error });
					callback({ message: 'Error obtaining the participants from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('participants', e, callback);
		}
	}
}

/**
 * Check if survey has given token
 * @param survey
 * @param token 
 */
function hasToken(survey, token){
	return function(callback){
		try{
			Log('LimesurveyController.hasToken -> Started');
			options.data = { method:'list_participants', params: [SESSIONKEY, survey, 0, 100000], id:1 };

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('hasToken', error, response, body, callback);
					}

					var found = false;
					for(i in body.result){
						if(body.result[i].token === token){
							found = true;
							break;
						}
					}

					Log('LimesurveyController.hasToken -> Completed');
					if(found){
						Log('LimesurveyController.hasToken -> Success');
						callback(null);
					}else{
						Log('LimesurveyController.hasToken -> Not found');
						callback({ message: 'Token not found for this survey' });
					}
				}).catch(error => {
					Log('LimesurveyController.hasToken -> error obtaining the participants');
					LogMultiple({ error: error });
					callback({ message: 'Error obtaining the participants from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('hasToken', e, callback);
		}
	}
}


/**
 * Get response of survey by identifier
 * @param sid
 * @param token
 * @param rid 
 */
function getResponseId(sid, token, rid){
	return function(callback){
		try{
			Log('LimesurveyController.getResponseId -> Started');
			options.data = { method: 'get_response_ids', params: [SESSIONKEY, sid, token], id:1 };

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('getResponseId', error, response, body, callback);
					}

					if(!body.error){
						if(body.result.length == 0){
							Log('LimesurveyController.getResponseId -> No responses found');
							callback({ message: 'No responses found in LimeSurvey' });
						}else{
							for(var i=0; i < body.result.length; i++){
								rid.push(body.result[i]);
							}

							Log('LimesurveyController.getResponseId -> Completed');
							callback(null);
						}
					}else{
						Log('LimesurveyController.getResponseId -> Error found in body');
						callback({ message: 'Error in LimeSurvey when obtaining responses', error: body.error });
					}
				}).catch(error => {
					callback({ message: 'LimeSurvey table not initialized' });
				});
		}catch(e){
			LogBigError('getResponseId', e, callback);
		}
	}
}

/**
 * Get responses of survey by identifier
 * @param sid
 * @param r 
 */
function getResponses(sid, participants, type){
	return function(callback){
		try{
			Log('LimesurveyController.getResponses -> Started');
			let headingType, responseType;
			if(type === 'full') {
				headingType='full';
				responseType='long';
				if(participants) {
					const responses = {};
					let completedRequests = 0;
					participants.forEach(participant => {
						options.data = {
							method: 'export_responses_by_token',
							params: [
								SESSIONKEY,
								sid,
								'json',
								participant,
								null,
								'all',
								headingType,
								responseType
							],
							id: 1
						};

						axios(options)
							.then(response => {
								const body = response.data;

								if (body && body.result && body.result.length > 0) {
									const decodedResult = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;
									for (var rid in decodedResult){
										for (var res in decodedResult[rid]){
											responses[participant] = decodedResult[rid][res];
										}
									}
								} else {
									responses[participant] = null;
								}
							})
							.catch(error => {
								console.error(`Error processing participant ${participant}:`, error.message);
								responses[participant] = null;
							})
							.finally(() => {
								completedRequests++;
								if (completedRequests === participants.length) {
									Log('LimesurveyController.getResponses -> Completed');
									callback(null, responses);
								}
							});
					});
				} else {
					options.data = {
						method: 'export_responses',
						params: [
							SESSIONKEY,      // Auth credentials
							sid,             // Survey ID
							'json',          // Document Type (e.g., json, pdf, csv)
							null,            // Language code (skip by setting null or omit)
							'all', 		     // Completion Status (optional)
							headingType,     // Heading Type (optional)
							responseType   	 // Response Type (optional)
						],
						id: 1
					};
					axios(options).then(response => {
						let body;
							try{
								body = response.data;
							}catch(error){
								return NotifyRCError('getResponses', error, response, body, callback);
							}
							let responses = {};
							if(body && body.result){
								if(body.result.length > 0){
									var raw = null;
									try{
										raw = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;
									}catch(e){
										Log('LimesurveyController.getResponses -> Error');
										Log(e);
										return callback({ message: 'Error transforming LimeSurvey result' });
									}
									if(participants){
										for (var rid in raw){
											for (var res in raw[rid]){
												if(participants.indexOf(raw[rid][res].token) > -1){
													if(!responses[raw[rid][res].token] || (responses[raw[rid][res].token] && !responses[raw[rid][res].token].submitdate)){
														responses[raw[rid][res].token] = raw[rid][res];
													}
												}
											}
										}
									}else{
										responses=raw;
									}
								}
								Log('LimesurveyController.getResponses -> Completed');
								callback(null, responses);
							}else{
								Log('LimesurveyController.getResponses -> Error');
								callback({ message: 'Malformed body received from LimeSurvey'});
							}
						}).catch(error => {
							Log('LimesurveyController.getResponses -> error exporting the responses');
							LogMultiple({ error: error });
							callback({ message: 'Error exporting the responses from LimeSurvey', error: error });
						});
				}
			} else {
				headingType='code';
				responseType='short';
				options.data = {
					method: 'export_responses',
					params: [
						SESSIONKEY,      // Auth credentials
						sid,             // Survey ID
						'json',          // Document Type (e.g., json, pdf, csv)
						null,            // Language code (skip by setting null or omit)
						'all', 		     // Completion Status (optional)
						headingType,     // Heading Type (optional)
						responseType   	 // Response Type (optional)
					],
					id: 1
				};
				axios(options).then(response => {
					let body;
						try{
							body = response.data;
						}catch(error){
							return NotifyRCError('getResponses', error, response, body, callback);
						}
						let responses = {};
						if(body && body.result){
							if(body.result.length > 0){
								var raw = null;
								try{
									raw = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;
								}catch(e){
									Log('LimesurveyController.getResponses -> Error');
									Log(e);
									return callback({ message: 'Error transforming LimeSurvey result' });
								}
								if(participants){
									for (var rid in raw){
										for (var res in raw[rid]){
											if(participants.indexOf(raw[rid][res].token) > -1){
												if(!responses[raw[rid][res].token] || (responses[raw[rid][res].token] && !responses[raw[rid][res].token].submitdate)){
													responses[raw[rid][res].token] = raw[rid][res];
												}
											}
										}
									}
								}else{
									for (var rid in raw){
										for (var res in raw[rid]){
											if(!responses[raw[rid][res].token] || (responses[raw[rid][res].token] && !responses[raw[rid][res].token].submitdate)){
												responses[raw[rid][res].token] = raw[rid][res];
											}
										}
									}
								}
							}
							Log('LimesurveyController.getResponses -> Completed');
							callback(null, responses);
						}else{
							Log('LimesurveyController.getResponses -> Error');
							callback({ message: 'Malformed body received from LimeSurvey'});
						}
					}).catch(error => {
						Log('LimesurveyController.getResponses -> error exporting the responses');
						LogMultiple({ error: error });
						callback({ message: 'Error exporting the responses from LimeSurvey', error: error });
					});
			}
		}catch(e){
			LogBigError('getResponses', e, callback);
		}
	}
}

/**
 * Get responses of class
 * @param sid
 * @param classroom
 * @param r 
 */
function getClassResponses(sid, classroom, r){
	return function(callback){
		try{
			Log('LimesurveyController.getClassResponses -> Started');
			r['content'] = '';
			options.data = {method:'export_responses',params:[SESSIONKEY,sid,'csv',null,'complete','code','short'],id:1};
			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('getClassResponses', error, response, body, callback);
					}

					Log(JSON.stringify(body));

					if(body && body.result){
						if(body.result.length > 0){
							var csv = null;

							try{
								csv = Buffer.from(body.result, 'base64').toString().split(/'\r?\n'|\r'/);
							}catch(e){
								Log('LimesurveyController.getClassResponses -> Error');
								Log(e);
								return callback({ message: 'Error transforming LimeSurvey result' });
							}
							

							for (var i = 1; i < csv.length; i++){
								var line = csv[i].split(',');
								if(line.length > 1){
									var token = line[4].replace(new RegExp('\'', 'g'),'');

									if(classroom.codes.indexOf(token) > -1)
										r['content'] += csv[i] + '\n';
								}
							}
						}
						
						Log('LimesurveyController.getClassResponses -> Completed');
						callback(null);
					}else{
						Log('LimesurveyController.getClassResponses -> Error');
						callback({ message: 'Malformed body received from LimeSurvey'});
					}
				}).catch(error => {
					Log('LimesurveyController.getClassResponses -> error exporting the filtered responses');
					LogMultiple({ error: error });
					callback({ message: 'Error exporting the responses from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('getClassResponses', e, callback);
		}
	}
}

/**
 * Check if token has completed survey
 * @param survey
 * @param token
 * @param rid 
 */
function tokenHasCompleted(survey, token, rid){
	return function(callback){
		try{
			Log('LimesurveyController.tokenHasCompleted -> Started');
			options.data = {method:'export_responses_by_token',params:[SESSIONKEY,survey,'json',token],id:1};

			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('tokenHasCompleted', error, response, body, callback);
					}

					var responses = null;

					if(body && body.result){
						try{
							responses = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;
						}catch(e){
							Log('LimesurveyController.tokenHasCompleted -> Error');
							Log(e);
							return callback({ message: 'Error transforming LimeSurvey result' });
						}

						if(rid.length >0){
							var completed = false;
							for(var i = 0; i < rid.length; i++){
								if(responses[i][rid[i]].submitdate){
									completed = true;
									break;
								}
							}

							if(completed){
								Log('LimesurveyController.tokenHasCompleted -> Completed');
								callback(null);
							}else{
								Log('LimesurveyController.tokenHasCompleted -> Completed: Survey not completed');
								callback({message: 'Survey not completed yet'});
							}

						}else{
							Log('LimesurveyController.tokenHasCompleted -> Completed: Not found');
							callback({message: 'Not response found'});
						}
					}else{
						Log('LimesurveyController.tokenHasCompleted -> Error');
						callback({ message: 'Malformed body received from LimeSurvey'});
					}
				}).catch(error => {
					Log('LimesurveyController.tokenHasCompleted -> error exporting the responses by token');
					LogMultiple({ error: error });
					callback({ message: 'Error obtaining the participants from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('tokenHasCompleted', e, callback);
		}
	}
}

/**
 * Check if token has completed survey
 * @param survey
 * @param token
 * @param rid 
 */
function getResponseByToken(survey, token, type){
	return function(callback){
		try{
			Log('LimesurveyController.getResponseByToken -> Started');
			let headingType='code'
			let responseType='short'
			if(type === 'full') {
				headingType='full'
				responseType='long'
			}
			options.data = {
				method: 'export_responses_by_token',
				params: [
					SESSIONKEY,      // Auth credentials
					survey,             // Survey ID
					'json',          // Document Type (e.g., json, pdf, csv)
					token, 			 // token for which responses needed
					null,            // Language code (skip by setting null or omit)
					'all', 		     // Completion Status (optional)
					headingType,     // Heading Type (optional)
					responseType    // Response Type (optional)
				],
				id: 1
			};
			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('getResponseByToken', error, response, body, callback);
					}

					var response = null;

					if(body && body.result){
						if(typeof body.result === "object" ){
							response = body.result;
						}else{
							try{
								response = JSON.parse(Buffer.from(body.result, 'base64').toString());
							}catch(e){
								try{
									response = JSON.parse(body.result);
								}catch(e){
									Log('LimesurveyController.getResponseByToken -> Error');
									Log(e);
									return callback({ message: 'Error transforming LimeSurvey result' });
								}
							}
						}

						if(!response.status){
							if(response.responses){
								if(response.responses.length > 0){
									for (var i = 0; i < response.responses.length; i++) {
										let keys = Object.keys(response.responses[i]);
										if(response.responses[i][keys[0]].submitdate !== null){
											return callback(null, response.responses[i][keys[0]]);
										}
									}

									let keys = Object.keys(response.responses[response.responses.length -1]);
									callback(null, response.responses[response.responses.length -1][keys[0]]);
								}else{
									let keys = Object.keys(response.responses[0]);
									callback(null, response.responses[0][keys[0]]);
								}
							}else{
								callback(null, false);
							}
						}else{
							Log('LimesurveyController.getResponseByToken -> Completed: Not found');
							callback(null, false);
						}
					}else{
						Log('LimesurveyController.getResponseByToken -> Error');
						callback({ message: 'Malformed body received from LimeSurvey'});
					}
				}).catch(error => {
					Log('LimesurveyController.getResponseByToken -> error exporting the responses by token');
					LogMultiple({ error: error });
					callback({ message: 'Error obtaining the participants from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('getResponseByToken', e, callback);
		}
	}
}

/**
 * Start tokens for survey by identifier 
 * @param surveyId
 */
function startTokensSurvey(surveyId, callback) {
	try{
		Log('LimesurveyController.startTokensSurvey -> Started');
		options.data = { method: 'activate_tokens', params: [SESSIONKEY, surveyId], id:1 };
		axios(options).then(response => {
			let body;
				try{
					body = response.data;
				}catch(error){
					return NotifyRCError('startTokensSurvey', error, response, body, callback);
				}

				Log('LimesurveyController.startTokensSurvey -> Completed: ' + surveyId);
				callback(null,surveyId);
			}).catch(error => {
				Log('LimesurveyController.startTokensSurvey -> error activating the tokens');
				LogMultiple({ error: error });
				callback({ message: 'Error activating the tokens on LimeSurvey', error: error });
			});
	}catch(e){
		LogBigError('startTokensSurvey', e, callback);
	}
}

/**
 * Add participants to survey 
 * @param classroom
 * @param survey 
 */
function addParticipants(participants, survey){
	return function(callback){
		try{
			Log('LimesurveyController.addParticipants -> Started: ' + survey);
			var tokens = [];
			for(var i in participants){
				tokens.push({email: participants[i] + '@dummy.dum', firstname: participants[i], lastname:'dummy', token: participants[i]});
			}

			
			options.data = { method:'add_participants', params: [SESSIONKEY, survey, tokens, false], id:1 };
			axios(options).then(response => {
				let body;
					try{
						body = response.data;
					}catch(error){
						return NotifyRCError('startTokensSurvey', error, response, body, callback);
					}

					Log('LimesurveyController.addParticipants -> Participants added:');
					Log('LimesurveyController.addParticipants -> Completed: ' + survey);

					callback(null, body.result);
				}).catch(error => {
					Log('LimesurveyController.addParticipants -> error adding the participants');
					LogMultiple({ error: error });
					callback({ message: 'Error adding the participants to LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('addParticipants', e, callback);
		}
	}
}


/**
 * Delete participants from survey
 * @param classroom
 * @param survey 
 */
function delParticipants(participants, survey){
	return function(callback){
		try{
			Log('LimesurveyController.delParticipants -> Started: ' + survey);
			options.data = {method:'delete_participants',params:[SESSIONKEY,survey,participants],id:1};
			axios(options).then(response => {
					let body; 
					try {
						body = response.data;
					} catch(error) {
						Log(error);
					}
					Log('LimesurveyController.delParticipants -> completed: ' + survey);
					Log(body);
					callback(null, body);
				}).catch(error => {
					Log('LimesurveyController.delParticipants -> error removing the participants');
					LogMultiple({ error: error });
					callback({ message: 'Error removing the participants from LimeSurvey', error: error });
				});
		}catch(e){
			LogBigError('delParticipants', e, callback);
		}
	}
}

module.exports = {
	setOptions: setOptions,
	setUser: setUser,
	create: create,
	clone: clone,
	online: online,
	auth: auth,
	insert: insert,
	copy: copy,
	getSurvey: getSurvey,
	getSurveyList: getSurveyList,
	getSurveysFromUser: getSurveysFromUser,
	start: start,
	remove: remove,
	started: started,
	participants: participants,
	hasToken: hasToken,
	getResponseId: getResponseId,
	getResponses: getResponses,
	getClassResponses: getClassResponses,
	tokenHasCompleted: tokenHasCompleted,
	getResponseByToken: getResponseByToken,
	startTokensSurvey: startTokensSurvey,
	addParticipants: addParticipants,
	delParticipants: delParticipants
}