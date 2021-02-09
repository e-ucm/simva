const ServerError = require('../../lib/error');
var mongoose = require('mongoose');

var LtiController = require('../../lib/lticontroller');

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
  console.log(options);

  let claims = {
      "https://purl.imsglobal.org/spec/lti/claim/message_type"    : "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/version"         : "1.3.0",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id"   : "D001",
      "https://purl.imsglobal.org/spec/lti/claim/target_link_uri" : "https://lti-ri.imsglobal.org/lti/tools/1376/launches",
      "https://purl.imsglobal.org/spec/lti/claim/resource_link"   : {
        "id"          : "link001",
        "title"       : "Resource 001",
        "description" : "Resource Description 001"
      },
      "https://purl.imsglobal.org/spec/lti/claim/roles"           : [
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
      ],

      "https://purl.imsglobal.org/spec/lti/claim/context"         : {
        "id": "context001",
        "label": "Ctxt001",
        "title":  "Context 001",
        "type": ["http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering"]
      },
      "https://purl.imsglobal.org/spec/lti/claim/tool_platform"   : {
        "guid": "tool_id_0001",
        "product_family_code": "SIMVA",
        "name": "SIMVA e-UCM"
      },
      "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice": {
        "context_memberships_url": "https://simva.e-ucm.es/lti/memberships",
        "service_versions": ["2.0"]
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