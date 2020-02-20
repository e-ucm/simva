const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var ActivitiesController = require('../../lib/activitiescontroller');
var StudiesController = require('../../lib/studiescontroller');
var TestsController = require('../../lib/testscontroller');

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivities = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await ActivitiesController.getActivities({});
  }catch(e){
    result = { status: 500, data: e };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addActivity = async (options) => {
  try {
    group = await ActivitiesController.addActivity(options.body);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: group };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivity = async (options) => {
  try {
    activity = await ActivitiesController.getActivity(options.id);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: activity };
};

/**
 * @param {Object} options
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateActivity = async (options) => {
  // Implement your business logic here...
  //
  // This function should return as follows:
  //
  // return {
  //   status: 200, // Or another success code.
  //   data: [] // Optional. You can put whatever you want here.
  // };
  //
  // If an error happens during your business logic implementation,
  // you should throw an error as follows:
  //
  // throw new ServerError({
  //   status: 500, // Or another error code.
  //   error: 'Server Error' // Or another error message.
  // });

  return {
    status: 200,
    data: 'updateActivity ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
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
    console.log(e);
    return {status: 500, data: e };
  }

  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
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
        body.status = 401;
        body.data.message = 'You are owner but not participant.';
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
 * @param {Object} options
 * @param {String} options.id The test ID
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
    console.log('GetTarget exploded:');
    console.log(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
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
    console.log('GetCompletion exploded:');
    console.log(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @param {String} options.user the user to check its completion status
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
 * @param {Object} options
 * @param {String} options.id The test ID
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
    let study = await ActivitiesController.getStudy(options.id);

    let participants = await StudiesController.getParticipants(study);

    if(participants.indexOf(options.user.data.username) !== -1){
      body.data = await activity.getResults([options.user.data.username]);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.getResults(users);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

  }catch(e){
    console.log('GetResult exploded:');
    console.log(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @param {String} options.user the user to check its completion status
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
      body.data.result = await activity.setResult(options.user.data.username, options.body);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        if(participants.indexOf(options.postuser) !== -1){
          body.data.result = await activity.setResult(options.postuser, options.body);
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
 * @param {Object} options
 * @param {String} options.id The test ID
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
      body.data = await activity.getResults([options.user.data.username]);
    }else{
      if(study.owners.indexOf(options.user.data.username) !== -1){
        let users = [];
        if(options.users && options.users !== ''){
          users = options.users.split(',');
        }

        body.data = await activity.getResults(users);
      }else{
        body.status = 401;
        body.data.message = 'You do not participate in the activity either as owner or user';
      }
    }

    if(body.status === 200){
      for (var i = 0; i < participants.length; i++) {
        body.data[participants[i]] = (body.data[participants[i]] !== null && body.data[participants[i]] !== undefined);
      }
    }

  }catch(e){
    console.log('GetResult exploded:');
    console.log(e);
    return {status: 500, data: e };
  }

  return body;
};

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getActivityTypes = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await ActivitiesController.getActivityTypes(options.user.data.username);
  }catch(e){
    console.log(e);
    result = { status: 500, data: e };
  }
  
  return result;
};