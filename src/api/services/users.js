const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var UsersController = require('../../lib/userscontroller');


/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getUser = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await UsersController.getUser(options.id);
  }catch(e){
    result = { status: 500, data: e };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getUsers = async (options) => {
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

    result.data = await UsersController.getUsers(query);
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
module.exports.addUser = async (options) => {
  var result = { status: 200, data: {} };

  try {
    let params = options.body;

    if(!params.external_entity){
      params.external_entity = [];
    }

    let users = await UsersController.getUsers({username: options.body.username});
    if(users.length > 0){
      result = { status: 400, data: { message: 'Username already exists.' } };
    }else{
      users = await UsersController.getUsers({email: options.body.email});
      if(users.length > 0){
        result = { status: 400, data: { message: 'Email already exists.' } };
      }else{
        try {
          let keycloakuser = await UsersController.addUserToKeycloak(params);
        }catch(e){
          console.log(e);
          return {status: 500, data: e };
        }
        
        let user = await UsersController.addUser(params);

        result = { status: 200, data: user };
      }
    }
  }catch(e){
    result = {status: 500, data: e };
  }

  return result;
};

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.loginUser = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await UsersController.authUser(options.body.username, options.body.password);
  }catch(e){
    result = { status: 400, data: e };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.main JWT of the main account
 * @param {String} options.secondary JWT of the secondary account
 * @param {String} options.domain domain name
 * @throws {Error}
 * @return {Promise}
 */
module.exports.linkUser = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await UsersController.linkUser(options.body.main, options.body.secondary, options.body.domain);
  }catch(e){
    result = { status: 400, data: e };
  }
  
  return result;
};

/**
 * @param {Object} options
 * @param {String} options.main JWT of the main account
 * @param {String} options.secondary JWT of the secondary account
 * @param {String} options.domain domain name
 * @throws {Error}
 * @return {Promise}
 */
module.exports.setRole = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await UsersController.setRole(options.body.username, options.body.role, options.body.keycloak_id);
  }catch(e){
    result = { status: 400, data: e };
  }
  
  return result;
};


/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
module.exports.eventUser = async (options) => {
  var result = { status: 200, data: {} };
  try{
    result.data = await UsersController.eventUser(options);
  }catch(e){
    result = { status: 400, data: e };
  }
  
  return result;
};