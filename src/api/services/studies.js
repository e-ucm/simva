const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var StudiesController = require('../../lib/studiescontroller');
var UsersController = require('../../lib/userscontroller');
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
    result.data = await StudiesController.getStudies({owners: options.user.data.username});
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
      owners: [options.user.data.username],
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
        if(study.owners.indexOf(options.user.data.username) !== -1){
          result = { status: 200, data: study };
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
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
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){

        if(study.owners.indexOf(options.user.data.username) !== -1){
          if(options.body.owners.indexOf(options.user.data.username) !== -1){

            let ownersadded = options.body.owners.filter(x => !study.owners.includes(x));
            var loadedownersadded = await UsersController.getUsers({"username" : {"$in" : ownersadded}});

            if(loadedownersadded.length !== ownersadded.length){
              result = { status: 404, data: {message: 'An owner added does not exist'} };
            }else{
              await StudiesController.updateStudy(options.id, options.body);
            }
          }else{
            result = { status: 400, data: {message: 'Teacher cannot remove itself from the study'} };
          }
        }else{
          result = { status: 401, data: {message: 'User is not authorized to update this study.'} };
        }
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
module.exports.deleteStudy = async (options) => {
  var result = { status: 200, data: {message: 'Study deleted'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          if(!await StudiesController.deleteStudy(options.id)){
            result = { status: 500, data: { message: 'Error deleting the study' } };
          }
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
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
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          var groups = await GroupsController.getGroups({"_id" : {"$in" : study.groups}});
          result = { status: 200, data: groups };
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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
module.exports.getStudyTests = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          var groups = await TestsController.getTests({"_id" : {"$in" : study.tests}});
          result = { status: 200, data: groups };
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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
module.exports.addTestToStudy = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          let test = await StudiesController.addTestToStudy(options.id, options.body);
          result = { status: 200, data: test };
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getTest = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id) && mongoose.Types.ObjectId.isValid(options.testid)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          var test = await TestsController.getTest(options.id);
          if(test !== null){
            result = { status: 200, data: test };
          }
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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

  if(mongoose.Types.ObjectId.isValid(options.id) && mongoose.Types.ObjectId.isValid(options.testid)){
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
 * @param {String} options.id The study ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.deleteTest = async (options) => {
  var result = { status: 200, data: {message: 'Test deleted'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id) && mongoose.Types.ObjectId.isValid(options.testid)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          let ntest = study.tests.indexOf(options.testid);
          if(ntest !== -1){
            study.tests.splice(ntest,1);
            if(!await StudiesController.updateStudy(options.id, study)){
              result = { status: 500, data: 'Error deleting the test' };
            }
          }
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addActivityToTest = async (options) => {
  try {
    options.body.test = options.id;

    let study = await StudiesController.getStudy(options.id);
    if(!test){
      return { status: 404, data: { message: 'Study not found' } };
    }

    let test = await TestsController.getTest(options.testid);
    if(!test){
      return { status: 404, data: { message: 'Test not found' } };
    }

    let activity = ActivitiesController.castToClass(await ActivitiesController.addActivity(options.body));

    test.activities.push(activity.id);
    await TestsController.updateTest(options.testid, test);

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
    if(mongoose.Types.ObjectId.isValid(options.id) && mongoose.Types.ObjectId.isValid(options.testid)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          var test = await TestsController.getTest(options.id);
          if(test !== null){
            var activities = await ActivitiesController.getActivities({"_id" : {"$in" : test.activities}});
            result = { status: 200, data: activities };
          }else{
            result = { status: 404, data: { message: 'Test not found' } };
          }
        }else{
          result = { status: 401, data: { message: 'You are not owner of the study' } };
        }
      }else{
        result = { status: 404, data: { message: 'Study not found' } };
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

