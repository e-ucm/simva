const ServerError = require('../../lib/error');
var mongoose = require('mongoose');
const logger = require('../../lib/logger');
var StudiesController = require('../../lib/studiescontroller');
var UsersController = require('../../lib/userscontroller');
var GroupsController = require('../../lib/groupscontroller');
var AllocatorsController = require('../../lib/allocatorscontroller');
var TestsController = require('../../lib/testscontroller');
var ActivitiesController = require('../../lib/activitiescontroller');
var sseClientsListManager = require('../../lib/utils/sseClientsListManager');

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
    let query = {};

    if(options.searchString && options.searchString !== ''){
      try{
        query = JSON.parse(options.searchString);
      }catch(e){
        return { status: 400, data: { message: 'searchString is not a valid JSON object.' } };
      }
    }

    if(options.user.data.role !== 'admin'){
      if(options.user.data.role === 'teacher'){
        query.owners = { "$in" : await UsersController.getEffectiveUsernames(options.user.data) };
      }else{
        let groups = await GroupsController.getGroups({participants: options.user.data.username});

        let ids = [];
        for (var i = groups.length - 1; i >= 0; i--) {
          ids.push(groups[i]._id);
        }

        query.groups = { "$in" : ids };

        result.data = await StudiesController.getStudies(query);
      }
    }

    result.data = await StudiesController.getStudies(query);
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
    let rawstudy = {
      name: options.body.name,
      owners: [options.user.data.username],
      tests: [],
      allocator: allocator.id,
      created: Date.now()
    };

    if(options.body.groups && options.body.groups.length > 0){
      rawstudy.groups = options.body.groups;
    }

    var study = await StudiesController.addStudy(rawstudy);
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }

  return { status: 200, data: study };
};


/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addStudyFromImport = async (options) => {
  let newStudy = JSON.parse(atob(options.file));
  try {
    var allocator = await AllocatorsController.createAllocator(AllocatorsController.getTypes()[0].getType());
    let rawstudy = {
      name: newStudy.name,
      owners: [options.user.data.username],
      tests: [],
      allocator: allocator.id,
      created: Date.now()
    };

    var study = await StudiesController.addStudy(rawstudy);
    for(var i=0; i< newStudy.tests.length; i++) {
      var newtest = newStudy.tests[i];
      var rawTest = {
        name : newtest.name,
      };
      var test = await StudiesController.addTestToStudy(study._id, rawTest);
      await TestsController.importTest(test, newtest, options.user.data.username);
    }
  }catch(e){
    logger.error(e);
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
module.exports.getStudyExport = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudyExport(options.id);
      if(study !== null){
        if(options.user.data.role === 'admin' || study.owners.indexOf(options.user.data.username) !== -1){
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
module.exports.getStudy = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(options.user.data.role === 'admin' || study.owners.indexOf(options.user.data.username) !== -1){
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
  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        let participants = await StudiesController.getParticipants(study);
        let currentuser = options.user.data.username;

        if(participants.indexOf(currentuser) !== -1){
          let allocator = await AllocatorsController.loadAllocator(study.allocator);
          let testid = await allocator.getAllocation(currentuser);

          await allocator.save();
          let test = await TestsController.getTest(testid);

          let schedule = {
            activities: {},
            next: null
          };

          for (var i = 0; i < test.activities.length; i++) {
            let activity = await ActivitiesController.loadActivity(test.activities[i]);

            let iscompleted = (await activity.getCompletion([currentuser]))[currentuser];

            schedule.activities[activity._id] = {
              name: activity.name,
              type: activity.type,
              details: await activity.getDetails(),
              completed: iscompleted,
              result: (await activity.getResults([currentuser]))[currentuser]
            }

            if(schedule.next == null && !iscompleted){
              schedule.next = activity._id;
            }
          }

          result =  { 
            status: 200,
            data: schedule
          };
        }else{
          if(study.owners.indexOf(options.user.data.username) !== -1){
            result =  {
              status: 400,
              data: { message: 'You are owner of the study but not participant' }
            };
          }else{
            result =  { 
              status: 401,
              data: { message: 'You do not participate in the study either as owner or user' }
            };
          }
        }

      }else{
        result = { status: 404, data: { message: 'Study not found' } };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid'} };
    }
  }catch(e){
    logger.error(e);
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
          options.body.owner=options.user.data.username;
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
    logger.error(e);
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
          var test = await TestsController.getTest(options.testid);
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
      var test = await TestsController.getTest(options.testid);
      if(test !== null){
        result = { status: 200, data: test };
      }else{
         return result = { status: 404, data: { message: 'Unable to load test.' } };
      }

      let activitiesdeleted = test.activities.filter(x => !options.body.activities.includes(x));
      let activitiesadded = options.body.activities.filter(x => !test.activities.includes(x));

      if(activitiesadded.length > 0){
        result = { status: 400, data: {message: 'Activities cannot be added through put interface.'} };
      }else{
        for (var i = 0; i < activitiesdeleted.length; i++) {
          await ActivitiesController.deleteActivity(activitiesdeleted[i]);
        }
        await TestsController.updateTest(options.testid, options.body);
        result = { status: 200, data: { message: 'Test updated.'} };
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
  }else{
    result = { status: 400, data: { message: 'ObjectId is not valid' } };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The activity ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateTestName = async (options) => {
  var result = { status: 200, data: {message: 'Test updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id) && mongoose.Types.ObjectId.isValid(options.testid)){
    try{
      var test = await TestsController.getTest(options.testid);
      if(test !== null){
        test.name = options.body.name;
        test.save();
        result = { status: 200, data: test };
      }else{
         return result = { status: 404, data: { message: 'Unable to load test.' } };
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
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

module.exports.getStudyEvents = async (options) => {
    logger.info(JSON.stringify(options));
    sseClientsListManager.addActivityAndUserToMap(options.id,options.user, options.userRole, options.clientId);
}


/**
 * @param {Object} options
 * @param {String} options.id The test ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addActivityToTest = async (options) => {
  try {
    options.body.test = options.testid;

    let study = await StudiesController.getStudy(options.id);
    if(!study){
      return { status: 404, data: { message: 'Study not found' } };
    }

    let test = await TestsController.getTest(options.testid);
    if(!test){
      return { status: 404, data: { message: 'Test not found' } };
    }

    if(!options.body.owners){
      options.body.owners = [options.user.data.username]
    }else{
      if(options.body.owners.indexOf(options.user.data.username) === -1){
        return { status: 400, data: { message: 'You have not included yourself as owner of the activity' } };
      }
    }

    let allocator = await AllocatorsController.loadAllocator(study.allocator);
    let participants = await allocator.getAllocatedForTest(options.testid);
    
    logger.debug("PARTICIPANTS: " + participants);
    if(study.tests.indexOf(options.testid) == 0) {
      if(allocator.type == "default") {
        let allgroups = study.groups;
        var loadedgroups = await GroupsController.getGroups({"_id" : {"$in" : allgroups}});
        let allUsers = loadedgroups.map(g => {return g.participants; }).flat();
        let pnotallocated = allUsers
        if(allocator.extra_data && allocator.extra_data.allocations){ 
          pnotallocated = allUsers.filter(x => !Object.keys(allocator.extra_data.allocations).includes(x));
        }
        participants=participants.concat(pnotallocated);
      } 
      logger.debug("PARTICIPANTS UPDATED: " + participants);
    }
    let activity = await TestsController.addActivityToTest(options.testid, options.body, participants);
    return {status: 200, data: activity };
  }catch(e){
    logger.error(e);
    return {status: 500, data: e };
  }
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
          var test = await TestsController.getTest(options.testid);
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
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        var allocator = await AllocatorsController.loadAllocator(study.allocator);

        if(allocator){
          if(options.body.type !== allocator.type){
            allocator = AllocatorsController.castToClass(options.body);
          }else{
            allocator.params = options.body;
          }

          if(await allocator.save()){
            if(study.allocator !== allocator.id){
              study.allocator = allocator.id;
              if(await study.save()){
                await StudiesController.updateStudy(study._id, study);
                result = { status: 200, data: {message: 'Allocator updated'} };
              }else{
                result = { status: 500, data: {message: 'Error updating the study'} };
              }
            }else{
              await StudiesController.updateStudy(study._id, study);
              result = { status: 200, data: {message: 'Allocator updated'} };
            }
          }else{
            result = { status: 500, data: {message: 'Error updating the allocator'} };
          }
        }else{
          result = { status: 400, data: {message: 'Unable to load the allocator'} };
        }
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
 * @param {String} options.id The group ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getStudyParticipants = async (options) => {
  var result = { status: 200, data: {message: 'Group updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var study = await StudiesController.getStudy(options.id);
      if(study !== null){
        if(study.owners.indexOf(options.user.data.username) !== -1){
          result.data = await UsersController.getUsers({"username" : {"$in" : await StudiesController.getParticipants(study)}});
        }else{
          result = { status: 401, data: {message: 'User is not authorized to access this study.'} };
        }
      }
    }catch(e){
      logger.error(e);
      result = { status: 500, data: e };
    }
  }else{
    result = { status: 400, data: { message: 'ObjectId is not valid' } };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getAllocatorTypes = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await AllocatorsController.getAllocatorTypes(options.user.data.username);
  }catch(e){
    logger.error(e);
    result = { status: 500, data: e };
  }
  
  return result;
};