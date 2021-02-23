const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var LtiController = require('../../lib/lticontroller');

var StudiesController = require('../../lib/studiescontroller');
var UsersController = require('../../lib/userscontroller');
var GroupsController = require('../../lib/groupscontroller');
var AllocatorsController = require('../../lib/allocatorscontroller');
var TestsController = require('../../lib/testscontroller');
var ActivitiesController = require('../../lib/activitiescontroller');

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
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiStatus = async (options) => {
  return { status: 200, data: { tool: false, platform: true } };
};

/**
 * @param {Object} options
 * @param {String} options.lti_login_hint simva signed JWT token with LTI-login data
 * @param {String} options.lti_message_hint simva signed JWT token with LTI-related data
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiClaims = async (options) => {
  let context = {};
  let tool = {};

  let username = "";

  try{
    let message_hint = await LtiController.decodeJWT(options.lti_message_hint);
    let login_hint = await LtiController.decodeJWT(options.lti_login_hint);
    let activity = await ActivitiesController.loadActivity(message_hint.activity);
    tool = await LtiController.getLtiTool(activity.extra_data.tool);
    context = JSON.parse(JSON.stringify(await activity.getLtiContext()));

    username = login_hint.participant;

    context.id = context._id;
    delete context._id;
    delete context.__v;
  }catch(e){
    console.log(e);
  }
  

  let claims = {
      "https://purl.imsglobal.org/spec/lti/claim/message_type"    : "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/version"         : "1.3.0",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id"   : "D001",
      "https://purl.imsglobal.org/spec/lti/claim/target_link_uri" : tool.redirect_uri,
      "https://purl.imsglobal.org/spec/lti/claim/resource_link"   : {
        "id"          : "link001",
        "title"       : "Resource 001",
        "description" : "Resource Description 001"
      },
      "https://purl.imsglobal.org/spec/lti/claim/roles"           : [
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
      ],

      "https://purl.imsglobal.org/spec/lti/claim/context"         : context,
      "https://purl.imsglobal.org/spec/lti/claim/tool_platform"   : {
        "guid": "tool_id_0001",
        "product_family_code": "SIMVA",
        "name": "SIMVA e-UCM"
      },
      "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice": {
        "context_memberships_url": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/memberships",
        "service_versions": ["2.0"]
      },
      "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": {
        "scope": [
          "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
          "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
          "https://purl.imsglobal.org/spec/lti-ags/scope/score",
        ],
        "lineitems": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/lineitems",
        "lineitem": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/lineitems/" + username + "/",
        "score": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/lineitems/" + username + "/score",
        "results": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/lineitems/" + username + "/results"
      }
  };

  return { status: 200, data: claims };
};

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiTools = async (options) => {
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

    result.data = await LtiController.getLtiTools(query);
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
module.exports.addLtiTool = async (options) => {
  try {
    tool = await LtiController.addLtiTool(options.body);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: tool };
};

/**
 * @param {Object} options
 * @param {String} options.id The lti tool ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiTool = async (options) => {
  var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){

      var tool = await LtiController.getLtiTool(options.id);

      if(tool !== null){
        result = { status: 200, data: tool };
      }else{
        result = { status: 404, data: {message: 'Not found'} };
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
 * @param {String} options.id The lti tool ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateLtiTool = async (options) => {
  try {
    if(options.body === {}){
      return {status: 400, data: {message: 'Tool cant be an empty object'} };
    }else{
      tool = await LtiController.updateLtiTool(options.id, options.body);
    }
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: tool };
};

/**
 * @param {Object} options
 * @param {String} options.id The lti tool ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.deleteLtiTool = async (options) => {
  try {
    tool = await LtiController.removeLtiTool(options.id);
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: tool };
};

module.exports.getLtiLineItems = async (options) => {
  console.log(options);

  return { status: 200, data: {} };
};
module.exports.getLtiLineItem = async (options) => {
  console.log(options);

  return { status: 200, data: {} };
};
module.exports.putLtiLineItem = async (options) => {
  console.log(options);

  return { status: 200, data: {} };
};
module.exports.setLtiLineItemScore = async (options) => {
  console.log(options);

  return { status: 200, data: {} };
};
module.exports.getLtiLineItemResults = async (options) => {
  console.log(options);

  return { status: 200, data: {} };
};

/**
 * @param {Object} options
 * @param {String} options.lti_login_hint simva signed JWT token with LTI-login data
 * @param {String} options.lti_message_hint simva signed JWT token with LTI-related data
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiMemberships = async (options) => {
  let memberships = {};

  try{
    let context = await LtiController.getLtiContext(options.context_id);
    let activityid = context.sourcedId.split(':')[1];
    let activity = await ActivitiesController.loadActivity(activityid);
    
    let member_usernames = Object.keys(activity.extra_data.participants);
    
    let members = await UsersController.getUsers({ username: member_usernames });

    memberships = {
      "id" : "https://simva-api.simva.e-ucm.es/lti/memberships?context_id=" + options.context_id,
      "context" : context,
      "members" : members
    };
  }catch(e){
    console.log(e);
    return { message: 'Error getting the memberships', error: e };
  }

  return { status: 200, data: memberships };
};