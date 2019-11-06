const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var TestsController = require('../../lib/testscontroller');
var ActivitiesController = require('../../lib/activitiescontroller');
var StudiesController = require('../../lib/studiescontroller');

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getTest = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var test = await TestsController.getTest(options.id);
      if(test !== null){
        result = { status: 200, data: test };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    result =  { status: 500, data: e };
  }

  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateTest = async (options) => {
  var result = { status: 200, data: {message: 'Test updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      await TestsController.updateTest(options.id, options.body);
    }catch(e){
      result = { status: 500, data: e };
    }
  }else{
    result = { status: 400, data: { message: 'ObjectId is not valid' } };
  }
  
  return result;
};


/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addActivityToTest = async (options) => {
  try {
    options.body.test = options.id;

    let test = await TestsController.getTest(options.id);
    if(!test){
      return { status: 404, data: { message: 'Test not found' } };
    }

    let activity = ActivitiesController.castToClass(await ActivitiesController.addActivity(options.body));

    test.activities.push(activity.id);
    await TestsController.updateTest(options.id, test);

    let studies = await StudiesController.getStudies({tests: options.id});
    if(studies.length !== 1){
      return {status: 500, data: { message: 'Unable to find the study of the test.' } };
    }
    let study = studies[0];
    let participants = await StudiesController.getParticipants(study);

    await activity.addParticipants(participants);

    return {status: 500, data: activity };
  }catch(e){
    console.log(e);
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
module.exports.getTestActivities = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var test = await TestsController.getTest(options.id);
      if(test !== null){
        var activities = await ActivitiesController.getActivities({"_id" : {"$in" : test.activities}});
        result = { status: 200, data: activities };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    result =  { status: 500, data: e };
  }

  return result;
};