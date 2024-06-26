const ServerError = require('../../lib/error');
var mongoose = require('mongoose');
const logger = require('../../lib/logger');

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
    logger.error(e);
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
        "lineitem": "https://simva-api.simva.e-ucm.es/lti/context/" + context.id + "/lineitems/" + username + "/"
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
    logger.error(e);
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
  logger.debug(options);

  return { status: 200, data: {} };
};
module.exports.getLtiLineItem = async (options) => {
  logger.debug(options);

  return { status: 200, data: {} };
};
module.exports.putLtiLineItem = async (options) => {
  logger.debug(options);

  return { status: 200, data: {} };
};
module.exports.setLtiLineItemScore = async (options) => {
  logger.debug(options);

  return { status: 200, data: {} };
};
module.exports.getLtiLineItemResults = async (options) => {
  logger.debug(options);

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
    logger.error(e);
    return { message: 'Error getting the memberships', error: e };
  }

  return { status: 200, data: memberships };
};

/**
 * @param {Object} options
 * @param {String} options.searchString pass an optional search string for result filtering
 * @param {Integer} options.skip number of records to skip for pagination
 * @param {Integer} options.limit maximum number of records to return
 * @throws {Error}
 * @return {Promise}
 */
module.exports.getLtiPlatforms = async (options) => {
  var result = { status: 200, data: {} };
  let query = {};

  try{
    if(options.searchString && options.searchString !== ''){
      try{
        query = JSON.parse(options.searchString);
      }catch(e){
        logger.error(e);
        return { status: 400, data: { message: 'searchString is not a valid JSON object.' } };
      }
    }

    result.data = await LtiController.getLtiPlatforms(query);
  }catch(e){
    result = { status: 500, data: e };
  }
  
  return result;
};

module.exports.addLtiPlatform = async (options) => {
  try {
    platform = await LtiController.addLtiPlatform(options.body);

    if(options.body.studyId){
      let group = await GroupsController.addGroup({
        name: 'LTI:' + options.body.name,
        owners: [],
        participants: [],
        link: { 
          type: 'lti_platform',
          id: platform._id
        },
        created: Date.now()
      });

      let study = await StudiesController.getStudy(options.body.studyId);

      study.groups.push(group._id);

      await StudiesController.updateStudy(study._id, study);
    }
    
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: platform };
};

module.exports.getLtiPlatform = async (options) => {
    var result = { status: 404, data: {message: 'Not found'} };

  try{
    if(mongoose.Types.ObjectId.isValid(options.id)){

      var platform = await LtiController.getLtiPlatform(options.id);

      if(platform !== null){
        result = { status: 200, data: platform };
      }else{
        result = { status: 404, data: {message: 'Not found'} };
      }
    }else{
      result = { status: 400, data: {message: 'ObjectId is not valid.'} };
    }
  }catch(e){
    logger.error(e);
    result =  { status: 500, data: e };
  }

  return result;
};

/**
 * @param {Object} options
 * @param {String} options.id The lti platform ID
 * @throws {Error}
 * @return {Promise}
 */
module.exports.updateLtiPlatform = async (options) => {
  try {
    if(options.body === {}){
      return {status: 400, data: {message: 'Platform cant be an empty object'} };
    }else{
      tool = await LtiController.updateLtiPlatform(options.id, options.body);
    }
  }catch(e){
    return {status: 500, data: e };
  }

  return { status: 200, data: tool };
};

module.exports.deleteLtiPlatform = async (options) => {
    try {
      var platform = await LtiController.getLtiPlatform(options.id);

      if(platform !== null){

        if(platform.studyId && platform.studyId !== ''){
          logger.debug('1');
          let query = { 'link.type': 'lti_platform', 'link.id': platform._id };
          logger.debug(query);
          let groups = await GroupsController.getGroups(query);

          if(groups.length !== 0){
            await GroupsController.removeGroup(groups[0]._id);

            logger.debug(groups);

            logger.debug('2');
            let study = await StudiesController.getStudy(platform.studyId);
            logger.debug(study);

            logger.debug('3');
            let todelete = -1;
            for (var i = 0; i < study.groups.length; i++) {
              logger.debug('4');
              if(study.groups[i].toString() === groups[0]._id.toString()){
                todelete = i;
                logger.debug('5');
                break;
              }
            }

            logger.debug('6');

            if(todelete >= 0){
              study.groups.splice(todelete, 1);
            }

            logger.debug('7');

            logger.debug(study);

            await StudiesController.updateStudy(study._id, study);
          }
        }
      }else{
        result = { status: 404, data: {message: 'Not found'} };
      }

      platform = await LtiController.removeLtiPlatform(options.id);
    }catch(e){
      return {status: 500, data: e };
    }

    return { status: 200, data: platform };
};

