const ServerError = require('../../lib/error');
var mongoose = require('mongoose');
const logger = require('../../lib/logger');
var ActivitiesController = require('../../lib/activitiescontroller');
var StudiesController = require('../../lib/studiescontroller');
var TestsController = require('../../lib/testscontroller');
const LimeSurveyActivity = require('../../lib/activities/LimeSurveyActivity');
const sendSimvaTaskToKafka = require('../../lib/utils/SimvaTaskToKafka');

/**
 * Get Activity List for a certain user
 * 
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivities = async (options) => {
  var result = { status: 200, data: {} };
  try{
    let query = {};

    if(options.searchString && options.searchString !== ''){
      try{
        query = JSON.parse(options.searchString);
      }catch(e){
        return { status: 400, data: { message: 'searchString is not a valid JSON object.' } };
      }
    }

    if(options.user.data.role === 'teacher'){
      query.owners = options.user.data.username;
    }

    result.data = await ActivitiesController.getActivities(query);
  }catch(e){
    logger.error(e);
    result = { status: 500, data: e };
  }
  
  return result;
};

/**
 * Add activity to current user
 * 
 * @param {Object} options
 * @param {Object} options.body the activity object
 * @params {String} options.body.username the username of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addActivity = async (options) => {
  try {
    group = await ActivitiesController.addActivity(options.body);
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }

  return { status: 200, data: group };
};

/**
 * Get Activity From Id
 * 
 * @param {Object} options
 * @param {String} options.id The activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivity = async (options) => {
  let result = { status: 200, data: null };

  try {
    activity = await ActivitiesController.getActivity(options.id);

    if(options.user.data.role === 'teacher'){
      if(activity.owners.indexOf(options.user.data.username) !== -1){
        result.data = activity;
      }else{
        result = { status: 401, data: { message: 'You are not owner of the activity' } };
      }
    }
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }

  return result;
};

/**
 * Export Activity for a later import in the plateform
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.exportActivity = async (options) => {
  let result = { status: 200, data: null };

  try {
    activity = await ActivitiesController.exportActivity(options.id, options.complete);

    if(options.user.data.role === 'teacher'){
      if(activity.owners.indexOf(options.user.data.username) !== -1){
        result.data = activity;
      }else{
        result = { status: 401, data: { message: 'You are not owner of the activity' } };
      }
    }
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }

  return result;
};

/**
 * Get Presigned Url For Data File from Minio for this activitiy
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getPresignedFileUrl = async (options) => {
  let result = { status: 200, data: {} };

  try {
    logger.info("getPresignedFileUrl");
    logger.info(options);
    if(options.user.data.role === 'teacher'){
      let activity = await ActivitiesController.loadActivity(options.id);
      if(activity.owners.indexOf(options.user.data.username) !== -1){
        let activityType=activity.type;
        logger.info(activityType);
        if (activityType == 'gameplay' && activity.extra_data.config.trace_storage || activityType == 'limesurvey' || activityType == 'manual') {
          presignedurl = await ActivitiesController.getPresignedFileUrl(options.id);
          logger.info(presignedurl);
          result.data.url = presignedurl;
        } else {
          result = { status: 401, data: { message: 'Error not a trace storage for this activity' }};
        }
      }else{
        result = { status: 401, data: { message: 'You are not owner of the activity' } };
      }
    }
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }

  return result;
};

/**
 * Update Activity from its ID
 * 
 * @param {Object} options
 * @param {String} options.id The activity ID
 * @param {Object} options.body the part of the activity object to patch
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateActivity = async (options) => {
  var result = { status: 200, data: {message: 'Activity updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var activity = await ActivitiesController.loadActivity(options.id);
      if(activity !== null){
        activity.patch(options.body);
        await activity.save();
        result = { status: 200, data: activity };
      }else{
         return result = { status: 404, data: { message: 'Unable to load activity.' } };
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
  }
  return result;
};

/**
 * Update Survey Owner for LimeSurvey to be editable by the others owners of the activity
 * 
 * @param {Object} options
 * @param {String} options.id The activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateSurveyOwner = async (options) => {
  var result = { status: 200, data: {message: 'Activity updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var activity = await ActivitiesController.loadActivity(options.id);
      if(activity !== null){
        if(activity.type == "limesurvey"){
          await activity.setSurveyOwnerFromUsername(options.user.data.username);
          result.data = activity;
        } else {
          return result = { status: 404, data: { message: 'Activity is not a Limesurvey one.' } };
       }
      }else{
         return result = { status: 404, data: { message: 'Unable to load activity.' } };
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
  }
  return result;
};

/**
 * Get Survey Language List to be able to change the language by default
 * 
 * @param {Object} options
 * @param {String} options.id The activity ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getSurveyLanguages = async (options) => {
  var result = { status: 200, data : null };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var activity = await ActivitiesController.loadActivity(options.id);
      if(activity !== null){
        if(activity.type == "limesurvey"){
          result.data = await activity.getSurveyLanguages();
        } else {
          return result = { status: 404, data: { message: 'Activity is not a Limesurvey one.' } };
       }
      }else{
         return result = { status: 404, data: { message: 'Unable to load activity.' } };
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
  }
  return result;
};


/**
 * Get Current User Survey List that he have access
 * 
 * @param {Object} options
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getUserSurveys = async (options) => {
  var result = { status: 200, data: null };

  try{
    result.data = await LimeSurveyActivity.getUtils(options.user.data.username);
  }catch(e){
    logger.error(e);
    result = { status: 500, data: e };
  }
  return result;
};

/**
 * Delete activity from its ID
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.deleteActivity = async (options) => {
  try {
    let activity = await ActivitiesController.getActivity(options.id);

    if(activity){

      await ActivitiesController.deleteActivity(options.id);

      if(activity.test){
        var test = await TestsController.getTest(activity.test);

        if(test !== null){
          let toremove = -1;
          for (var i = 0; i < test.activities.length; i++) {
            let activityid = activity._id.toString();
            if(test.activities[i] === activityid){
              toremove = i;
              break;
            }
          }

          if(toremove > -1){
            test.activities.splice(toremove, 1);
            await TestsController.updateTest(activity.test, test);
          }
        }else{
           return { status: 404, data: { message: 'Unable to load test.' } };
        }
      }

      result = { status: 200, data: { message: 'Activity deleted' } }
    }else{
      result = { status: 404, data: { message: 'Activity not found.' } };
    }
  }catch(e){
    logger.debug(e);
    return {status: 500, data: e };
  }

  return result;
};

/**
 * Get to know if the activity is openable in the webbrowser or if it is an external activity
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getOpenable = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data.openable = activity.canBeOpened();
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        body.data.openable = activity.canBeOpened();
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Get URL Target for an openable activity in the webbrowser
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.users the users list to get the target URL
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getTarget = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.target([options.user.data.username]);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.target(users);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    logger.info('GetTarget exploded:');
    logger.error(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Get Progress for current Activity
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.users the users list to get the progress
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getProgress = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.getProgress([options.user.data.username]);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.getProgress(users);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    logger.info('GetProgress exploded:');
    logger.error(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Get the completion of an activity
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.users the users list to get the completion
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getCompletion = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.getCompletion([options.user.data.username]);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.getCompletion(users);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    logger.info('GetCompletion exploded:');
    logger.error(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Set Activity Completion Status for a user
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.postuser the user to check its completion status
 * @param {Object} options.body The Activity body
 * @param {String} options.body.status The Activity body completion
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setCompletion = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data.result = await activity.setCompletion(options.user.data.username, options.body.status);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        if(participants.indexOf(options.postuser) !== -1){
          body.data.result = await activity.setCompletion(options.postuser, options.body.status);
        }else{
          body.status = 400;
          body.data.message = 'The user you are trying to set completion to is not a participant';
        }
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Set Activity Completion Status for a user
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {Object} options.body The Activity body
 * @param {String} options.body.status The Activity body completion
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setMultiCompletion = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    if(activity.owners.indexOf(options.user.data.username) !== -1){
      body.data.result = await activity.setMultiCompletion(options.body.status);
    }else{
      body.status = 401;
      body.data.message = 'You do not participate in the activity as owner';
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Set Suspension Status for an Activity
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {String} options.user the user to check its completion status
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.postuser the user to set the suspension status 
 * @param {boolean} options.status the status to set the suspension status
 * @param {String} options.reason the reason to set the suspension status
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setSuspension = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);
    let date = new Date();
    if(participants.indexOf(options.user.data.username) !== -1){
      await activity.setSuspension(options.user.data.username, options.status);
      if(! (await activity.getCompletion([options.user.data.username]))[options.user.data.username]) {
        let verb;
        if(options.status) {
          verb="Suspended";
        } else {
          verb="Resumed";
        }
        sendSimvaTaskToKafka([{
          task: 'sendXAPITraceForActivity',
          params: 'user,verb,timestamp,result,reason',
          object: 'Activity',
          objectLoad:true,
          objectId: options.id,
          user: options.user.data.username,
          verb: verb,
          timestamp: date.toISOString(),
          result:null,
          reason:options.reason
        }]);
        body.data.result = { msg : "OK" };
      }
    }else{
      if(study.owners.indexOf(options.data.user.data.username) !== -1){
        if(participants.indexOf(options.postuser) !== -1){
          await activity.setSuspension(options.postuser, options.status);
          if(! (await activity.getCompletion([options.postuser]))[options.postuser]) {
            let verb;
            if(options.status) {
              verb="Suspended";
            } else {
              verb="Resumed";
            }
            await sendSimvaTaskToKafka([{
              task: 'sendXAPITraceForActivity',
              params: 'user,verb,timestamp,result,reason',
              object: 'Activity',
              objectLoad:true,
              objectId: options.id,
              user: options.postuser,
              verb: verb,
              timestamp: date.toISOString(),
              result:null,
              reason:options.reason
            }]);
            body.data.result = { msg : "OK" };
          }
        }else{
          body.status = 400;
          body.data.message = 'The user you are trying to set suspension to is not a participant';
        }
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Get the result of an Activity for a given user
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the user to check its completion status
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {Object} options.res The response object
 * @param {String} options.users the users list to get the result
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getResult = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    if(activity.setUserToken){activity.setUserToken(options.token);}
    if(activity.setRes){activity.setRes(options.res);}
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.getResults([options.user.data.username], options.type);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.getResults(users, options.type);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    logger.info('GetResult exploded:');
    logger.error(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Set statement(s) for an activity
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.postuser The user to set statement
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setStatement = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);
    if(options.user.data.role == 'lrsmanager' || participants.indexOf(options.user.data.username) !== -1 ){
      body.data = await activity.setStatement(options.user.data.username, options.body);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        if(participants.indexOf(options.postuser) !== -1){
          body.data = await activity.setStatement(options.postuser, options.body);
        }else{
          body.status = 400;
          body.data.message = 'The user you are trying to set statement to is not a participant';
        }
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user or as admin';
      }
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Not implemented yet.
 * 
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.NotImplemented = async (options) => {
  let body = {
    status: 501,
    data: { message : "Not implemented" }
  }

  return body;
};

/**
 * Set result for an activity.
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.postuser the user to set result
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setResult = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.setResult(options.user.data.username, options.body);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        if(participants.indexOf(options.postuser) !== -1){
          body.data = await activity.setResult(options.postuser, options.body);
        }else{
          body.status = 400;
          body.data.message = 'The user you are trying to set result to is not a participant';
        }
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Check if an Activity has a result for a given user
 * 
 * @param {Object} options
 * @param {String} options.id The Activity ID
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @param {String} options.users the users list to get the result
 * @throws {Error}
 * @return {Promise}
 */
module.exports.hasResult = async (options) => {
  let body = {
    status: 200,
    data: { }
  }

  try {
    let activity = await ActivitiesController.loadActivity(options.id);
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.hasResults([options.user.data.username], options.type);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.hasResults(users, options.type);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    logger.info('GetResult exploded:');
    logger.error(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * Get the activity types for a user
 * 
 * @param {Object} options
 * @param {Object} options.user the current user
 * @param {Object} options.user.data the current user data
 * @param {String} options.user.data.username the username of the current user
 * @param {String} options.user.data.role the role of the current user
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivityTypes = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await ActivitiesController.getActivityTypes(options.user.data.username);
  }catch(e){
    logger.error(e);
    result = { status: 500, data: e };
  }
  
  return result;
};