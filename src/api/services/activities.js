const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var ActivitiesController = require('../../lib/activitiescontroller');

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
    group = await ActivitiesController.getActivity(options.id);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: group };
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
    await ActivitiesController.deleteActivity(options.id);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: { message: 'Activity deleted' } };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getOpenable = async (options) => {
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
    data: 'getOpenable ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.openActivity = async (options) => {
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
    data: 'openActivity ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getCompletion = async (options) => {
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
    data: 'getCompletion ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @param {String} options.user the user to check its completion status
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setCompletion = async (options) => {
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
    data: 'setCompletion ok!'
  };
};

