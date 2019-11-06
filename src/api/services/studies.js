const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var StudiesController = require('../../lib/studiescontroller');
var GroupsController = require('../../lib/groupscontroller');
var AllocatorsController = require('../../lib/allocatorscontroller');
var TestsController = require('../../lib/testscontroller');

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getStudies = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await StudiesController.getStudies({});
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
module.exports.addStudy = async (options) => {
  try {
    var allocator = await AllocatorsController.createAllocator(AllocatorsController.getTypes()[0].getType());
    var study = await StudiesController.addStudy({
      name: options.body.name,
      owners: ['me'],
      tests: [],
      participants: [],
      allocator: allocator.id,
      created: Date.now()
    });
  }catch(e){
    console.log(e);
    return {status: 500, data: e };
  }

  return { status: 200, data: study };
};

/**
 * @param {Object} options
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getStudy = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        result = { status: 200, data: study };
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
module.exports.updateStudy = async (options) => {
  var result = { status: 200, data: {message: 'Study updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      await StudiesController.updateStudy(options.id, options.body);
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
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.deleteStudy = async (options) => {
  var result = { status: 200, data: {message: 'Study deleted'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      if(!await StudiesController.deleteStudy(options.id)){
        result = { status: 404, data: { message: 'Study not found' } };
      }
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
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getSchedule = async (options) => {
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
    data: 'getSchedule ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getStudyGroups = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      console.log(options.id);
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        var groups = await GroupsController.getGroups({"_id" : {"$in" : study.groups}});
        result = { status: 200, data: groups };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.addGroupToStudy = async ( options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.groups.indexOf(options.body.group) === -1){
          return await StudiesController.addGroupToStudy(options.id, options.body.group);
        }else{
          result = { status: 400, data: {message: 'Group already exists in the study.'}  };
        }
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.removeGroupFromStudy = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.groups.indexOf(options.body.group) !== -1){
          return await StudiesController.removeGroupFromStudy(options.id, options.body.group);
        }else{
          result = { status: 400, data: {message: 'Group does not exists in the study.'}  };
        }
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.getStudyTests = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      console.log(options.id);
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        var groups = await TestsController.getTests({"_id" : {"$in" : study.tests}});
        result = { status: 200, data: groups };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.addTestToStudy = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.groups.indexOf(options.body.group) === -1){
          let test = await StudiesController.addTestToStudy(options.id, options.body);
          result = { status: 400, data: test };
        }else{
          result = { status: 400, data: {message: 'Group already exists in the study.'}  };
        }
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.getStudyAllocator = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        var allocator = await AllocatorsController.getAllocator(study.allocator);
        result = { status: 200, data: allocator };
      }else{
        result = { status: 404, data: {message: 'Unable to find the study'} };
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
module.exports.setStudyAllocator = async (options) => {
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
    data: 'setStudyAllocator ok!'
  };
};

