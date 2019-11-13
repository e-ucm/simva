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

var request = require('request');
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
		console.info(line);
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
	Log(e);
	callback(e);
}

function NotifyRCError(name, error, response, body, callback){
	Log('LimesurveyController.' + name + ' -> Error parsing body');
	LogMultiple({error: error, response: response, body: body});
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
	options.body = JSON.stringify({});

	request(options, function(error, response, body){
		try{
			if (!error && response.statusCode == 200) {
				console.log('Limesurvey ONLINE')
				callback(null);
			}
			else {
				Log('LimesurveyController.online -> Unable to reach service')
				LogMultiple({error: error, response: response, body: body});
				callback({ message: 'LimeSurvey service unreachable.', error: error});
			}
		}catch(e){
			LogBigError('online', e, callback);
		}
	});
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
	options.body = JSON.stringify({method:'release_session_key',params:[SESSIONKEY],id:1});
	try{
		request(options, function(error, response, body){
		  if (!error && response.statusCode == 200) {
		  	try{
				body = JSON.parse(body);
			}catch(e){
				return NotifyRCError('release_session_token', error, response, body, callback);
			}
			Log('LimesurveyController.release_session_token -> Key released:');
			LogMultiple({result: body.result});
			callback(null);
		  }else{
		  	Log('LimesurveyController.release_session_token -> ERROR:');
		  	LogMultiple({error: error, response: response, body: body});
		  	callback({ message: 'Error releasing session token', error: error });
		  }
		});
	}catch(e){
		LogBigError('release_session_token', e, callback);
	}
}


function update_auth_token(callback){
	Log('LimesurveyController.update_auth_token -> Started');
	options.body = JSON.stringify({method:'get_session_key',params:[user,pass],id:1});

	try{
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				try{
					body = JSON.parse(body);
				}catch(e){
					return NotifyRCError('update_auth_token', error, response, body, callback);
				}

				Log('LimesurveyController.update_auth_token -> New key: ' + body.result);

				SESSIONKEY = body.result;
				session_timestamp = Math.round(new Date().getTime()/1000);

				Log('LimesurveyController.update_auth_token -> Completed');
				callback(null);
			}else{
				Log('LimesurveyController.update_auth_token -> error on auth');
				LogMultiple({error: error, response: response, body: body});
				callback({ message: 'Error trying to auth', error: error });
			}
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
		options.body = JSON.stringify({method:'import_survey',params:[SESSIONKEY, survey, 'lss'],id:1});

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
		options.body = JSON.stringify({method:'copy_survey',params:[SESSIONKEY, surveyId, name],id:1});

		insertOrCopy('copy', options, callback);
	}
}

function insertOrCopy(name, options, callback){
	try{
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				try{
					body = JSON.parse(body);
				}catch(e){
					return NotifyRCError(name, error, response, body, callback);
				}

				Log('LimesurveyController.' + name + ' -> New Survey ID: ' + body.result);
				Log('LimesurveyController.' + name + ' -> Completed');
			
				callback(null, body.result);
			}else{
				Log('LimesurveyController.' + name + ' -> error creating the survey');
				LogMultiple({error: error, response: response, body: body});
				callback({ message: 'Error trying to ' + name + ' the survey into LS', error: error });
			}  
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
function get(sid,survey) {
	return function(callback) {
		options.body = JSON.stringify({method:'list_surveys',params:[SESSIONKEY],id:1});

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				for(i in body.result){
					if(body.result[i].sid == sid){
						survey[0] = body.result[i];
						break;
					}
				}
				if(!survey[0])
					callback(true, 'Survey not found');
				else
					callback(null);
			}
			else console.log('ERROR GET SURVEY -->'+body);  
		});
	}
}

/**
 * Start survery by identifier
 * @param surveyId 
 */
function start(surveyId,callback) {
	options.body = JSON.stringify({method:'activate_survey',params:[SESSIONKEY,surveyId],id:1});
	console.log('STARTING -->' + surveyId);

	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);
			console.log('SURVEY STARTED -->'+body.result);
			callback(null,surveyId);
		}
		else console.log('ERROR START -->'+body);  
	});
}

/**
 * Remove survey by identifier
 * @param surveyId 
 */
function remove(surveyId) {
	return function(callback){
		options.body = JSON.stringify({method:'delete_survey',params:[SESSIONKEY,surveyId],id:1});
		console.log('DELETING -->' + surveyId);

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				console.log('SURVEY DELETED -->');
				console.log(body.result);
				callback(null);
			}
			else console.log('ERROR DELETE -->'+body);  
		});
	}
}

/**
 * Check if survey is started
 * @param survey 
 */
function started(survey){
	return function(callback){
		if(survey[0].active === 'N')
			callback(true,'Survey is not active');
		else
			callback(null);
	}
}

/**
 * List participants of survey
 * @param survey
 * @param participants 
 */
function participants(survey, participants){
	return function(callback){
		options.body = JSON.stringify({method:'list_participants',params:[SESSIONKEY,survey],id:1});

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				for(i in body.result){
					if(body.result[i].sid == sid){
						survey[0] = body.result[i];
						break;
					}
				}
				callback(null);
			}
			else callback(true,error);  
		});
	}
}

/**
 * Check if survey has given token
 * @param survey
 * @param token 
 */
function hasToken(survey,token){
	return function(callback){
		options.body = JSON.stringify({method:'list_participants',params:[SESSIONKEY,survey,0,100000],id:1});

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				var found = false;

				for(i in body.result){
					if(body.result[i].token === token){
						found = true;
						break;
					}
				}

				if(found)
					callback(null);
				else
					callback(true,'Token not found for this survey');
			}
			else callback(true,error);  
		});
	}
}


/**
 * Get response of survey by identifier
 * @param sid
 * @param token
 * @param rid 
 */
function getResponseId(sid,token,rid){
	return function(callback){
		options.body = JSON.stringify({method:'get_response_ids',params:[SESSIONKEY,sid,token],id:1});

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				if(!body.error){
					if(body.result.length == 0)
						callback(true,'Not responses');
					else{
						for(var i=0; i<body.result.length; i++)
							rid.push(body.result[i]);

						callback(null);
					}
				}else
					callback(true,body.error);
			}
			else{
				callback(true,'table not initialized');
			}
		});
	}
}

/**
 * Get responses of survey by identifier
 * @param sid
 * @param r 
 */
function getResponses(sid,r){
	return function(callback){
		options.body = JSON.stringify({method:'export_responses',params:[SESSIONKEY,sid,'json','es','all','code','short'],id:1});
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				if(body.result.length > 0){
					var raw = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;

					for (var rid in raw){
						for (var res in raw[rid]){
							if(!r[raw[rid][res].token] || (r[raw[rid][res].token] && !r[raw[rid][res].token].submitdate))
								r[raw[rid][res].token] = raw[rid][res];
						}
					}
				}
				
				callback(null);
			}
			else callback(true,error);  
		});
	}
}

/**
 * Get responses of class
 * @param sid
 * @param classroom
 * @param r 
 */
function getClassResponses(sid,classroom, r){
	return function(callback){
		r['content'] = '';
		options.body = JSON.stringify({method:'export_responses',params:[SESSIONKEY,sid,'csv','es','complete','code','short'],id:1});
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				if(body.result.length > 0){
					var csv = Buffer.from(body.result, 'base64').toString().split(/'\r?\n'|\r'/);

					for (var i = 1; i < csv.length; i++){
						var line = csv[i].split(',');
						if(line.length > 1){
							var token = line[4].replace(new RegExp('\'', 'g'),'');

							if(classroom.codes.indexOf(token) > -1)
								r['content'] += csv[i] + '\n';
						}
					}
				}
				
				callback(null);
			}
			else callback(true,error);  
		});
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
		options.body = JSON.stringify({method:'export_responses_by_token',params:[SESSIONKEY,survey,'json',token,'es','all','code','short'],id:1});

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				responses = JSON.parse(Buffer.from(body.result, 'base64').toString()).responses;

				if(rid.length >0){
					var completed = false;
					for(var i = 0; i < rid.length; i++){
						if(responses[i][rid[i]].submitdate){
							completed = true;
							break;
						}
					}

					if(completed)
						callback(null);
					else
						callback(true, 'Survey not completed yet');

				}else callback(true, 'Not response found');
			}
			else callback(true,error);  
		});
	}
}

/**
 * Start tokens for survey by identifier 
 * @param surveyId
 */
function startTokensSurvey(surveyId,callback) {
	options.body = JSON.stringify({method:'activate_tokens',params:[SESSIONKEY,surveyId],id:1});

	request(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);
			console.log('SURVEY TOKENS STARTED -->'+body.result);
			callback(null,surveyId);
		}
		else console.log('ERROR TOKEN -->'+body);  
	});
}

/**
 * Add participants to survey 
 * @param classroom
 * @param survey 
 */
function addParticipants(participants, survey){
	return function(callback){
		console.log('ADDING PARTICIPANTS TO SURVEY -->' + survey);
		var tokens = [];
		for(var i in participants)
			tokens.push({email: participants[i] + '@dummy.dum',firstname: participants[i] ,lastname:'dummy',token: participants[i]});

		
		options.body = JSON.stringify({method:'add_participants',params:[SESSIONKEY,survey,tokens,false],id:1});
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				console.info(response);
				console.log('PARTICIPANTS ADDED TO SURVEY -->' + survey);
				callback(null,body.result);
			}
			else console.log('ERROR ADDING PARTICIPANTS SURVEY -->' + body); 
		});
					
	}
}

/**
 * Add participants to survey 
 * @param classroom
 * @param survey 
 */
function addParticipantsToMultipleSurveys(participants, surveys){
	return function(callback){
		var alumnos = [];
		for(var i in participants)
			alumnos.push({email: participants[i] + '@dummy.dum',firstname: participants[i] ,lastname:'dummy',token: participants[i]});

		options.body = JSON.stringify({method:'add_participants',params:[SESSIONKEY,survey.pre,alumnos,false],id:1});
		
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				options.body = JSON.stringify({method:'add_participants',params:[SESSIONKEY,survey.post,alumnos,false],id:1});
				request(options, function(error, response, body){
					if (!error && response.statusCode == 200) {
						options.body = JSON.stringify({method:'add_participants',params:[SESSIONKEY,survey.teacher,alumnos,false],id:1});
						request(options, function(error, response, body){
							if (!error && response.statusCode == 200) {
								callback(null,body.result);
							}
							else console.log('ERROR PARTICIPANTS SURVEY TEACHER -->'+body); 
						});
					}
					else console.log('ERROR PARTICIPANTS SURVEY POST -->'+body);  
				});
			}
			else console.log('ERROR PARTICIPANTS SURVEY PRE -->'+body);  
		});
	}
}


/**
 * Delete participants from survey
 * @param classroom
 * @param survey 
 */
function delParticipants(participants, survey){
	return function(callback){
		console.log('REMOVING PARTICIPANTS FROM SURVEY -->' + survey);
		options.body = JSON.stringify({method:'delete_participants',params:[SESSIONKEY,survey,participants],id:1});
		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				console.log('PARTICIPANTS REMOVED FROM SURVEY -->' + survey);
				console.log(response.body);
				callback(null,response.body);
			}
			else console.log('ERROR REMOVING PARTICIPANTS FROM SURVEY -->'+body);  
		});
	}
}

/**
 * Delete participants from survey
 * @param classroom
 * @param survey 
 */
function delParticipantsFromMultipleSurveys(classroom, survey){
	return function(callback){
		options.body = JSON.stringify({method:'delete_participants',params:[SESSIONKEY,survey.pre,classroom.codes],id:1});
		
		console.log(options.body);

		request(options, function(error, response, body){
			if (!error && response.statusCode == 200) {
				console.log(body);
				options.body = JSON.stringify({method:'delete_participants',params:[SESSIONKEY,survey.post,classroom.codes],id:1});
				request(options, function(error, response, body){
					if (!error && response.statusCode == 200) {
						options.body = JSON.stringify({method:'delete_participants',params:[SESSIONKEY,survey.teacher,classroom.codes],id:1});
						request(options, function(error, response, body){
							if (!error && response.statusCode == 200) {
								callback(null,body.result);
							}
							else console.log('ERROR PARTICIPANTS SURVEY TEACHER -->'+body);  
						});
					}
					else console.log('ERROR PARTICIPANTS SURVEY POST -->'+body);  
				});
			}
			else console.log('ERROR PARTICIPANTS SURVEY PRE -->'+body);  
		});
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
	get: get,
	start: start,
	remove: remove,
	started: started,
	participants: participants,
	hasToken: hasToken,
	getResponseId: getResponseId,
	getResponses: getResponses,
	getClassResponses: getClassResponses,
	tokenHasCompleted: tokenHasCompleted,
	startTokensSurvey: startTokensSurvey,
	addParticipants: addParticipants,
	delParticipants: delParticipants
}