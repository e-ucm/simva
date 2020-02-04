const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var GroupsController = require('../../lib/groupscontroller');
var UsersController = require('../../lib/userscontroller');

if(!Array.prototype.flat){
  Object.defineProperty(Array.prototype, 'flat', {
      value: function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
          return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
      }
  });
}

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getGroups = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await GroupsController.getGroups({owners: options.user.data.username});
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
module.exports.addGroup = async (options) => {
  try {
    group = await GroupsController.addGroup({
      name: options.body.name,
      owners: [options.user.data.username],
      participants: [],
      created: Date.now()
    });
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: group };
};

/**
 * @param {Object} options
 * @param {String} options.id The group ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getGroup = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){
      var group = await GroupsController.getGroup(options.id);
      if(group !== null){
        if(group.owners.indexOf(options.user.data.username) !== -1 || group.participants.indexOf(options.user.data.username) !== -1){
          result = { status: 200, data: group };
        }else{
          result = { status: 401, data: {message: 'User is not authorized to obtain group data.'} };
        }
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid.'} };
    }
  }catch(e){
    console.log(e);
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
module.exports.updateGroup = async (options) => {
  var result = { status: 200, data: {message: 'Group updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var group = await GroupsController.getGroup(options.id);
      if(group !== null){
        if(group.owners.indexOf(options.user.data.username) !== -1){
          if(options.body.owners.indexOf(options.user.data.username) !== -1){

            let ownersadded = options.body.owners.filter(x => !group.owners.includes(x));
            let participantsadded = options.body.participants.filter(x => !group.participants.includes(x));

            let allusers = [ownersadded, participantsadded].flat();
            allusers = allusers.filter((g,i) => allusers.indexOf(g) === i);
            var loadedusers = await UsersController.getUsers({"username" : {"$in" : allusers}});

            // Filtering loadedgroups to obtain the old groups
            var loadedownersadded = loadedusers.filter(x => ownersadded.includes(x.username.toString()));

            // Getting the new groups added.
            var loadedparticipantsadded = loadedusers.filter(x => participantsadded.includes(x.username.toString()) );

            if(loadedownersadded.length !== ownersadded.length){
              result = { status: 404, data: {message: 'An owner added does not exist'} };
            }else if(loadedparticipantsadded.length !== participantsadded.length){
              result = { status: 404, data: {message: 'A participant added does not exist'} };
            }else{
              if(await GroupsController.updateGroup(options.id, options.body)){
                result.data = { message: 'Group updated' };
              }else{
                result = { status: 500, data: {message: 'Error updating the group.'} };
              }
            }
          }else{
            result = { status: 400, data: {message: 'Teacher cannot remove itself from the group'} };
          }
        }else{
          result = { status: 401, data: {message: 'User is not authorized to update this group.'} };
        }
      }
    }catch(e){
      console.log(e);
      result = { status: 500, data: e };
    }
  }else{
    result = { status: 400, data: { message: 'ObjectId is not valid' } };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The group ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getGroupStudies = async (options) => {
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
    data: 'getGroupStudies ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The group ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.addStudyToGroup = async (options) => {
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
    data: 'addStudyToGroup ok!'
  };
};

/**
 * @param {Object} options
 * @param {String} options.id The group ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getGroupParticipants = async (options) => {
  var result = { status: 200, data: {message: 'Group updated'} };

  if(mongoose.Types.ObjectId.isValid(options.id)){
    try{
      var group = await GroupsController.getGroup(options.id);
      if(group !== null){
        if(group.owners.indexOf(options.user.data.username) !== -1){
          result.data = await UsersController.getUsers({"username" : {"$in" : group.participants}});
        }else{
          result = { status: 401, data: {message: 'User is not authorized to access this group.'} };
        }
      }
    }catch(e){
      console.log(e);
      result = { status: 500, data: e };
    }
  }else{
    result = { status: 400, data: { message: 'ObjectId is not valid' } };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The class ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getGroupPrintable = async (options) => {
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
    data: 'getGroupPrintable ok!'
  };
};

