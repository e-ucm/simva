const logger = require('../logger');
process.env.DEBUG = '*';

var mongoose = require('mongoose');
var config = require('../config');
const lti = require('ltijs').Provider;
var requireText = require('require-text');
const jwt = require('jsonwebtoken');

var UsersController = require('../userscontroller');
var GroupsController = require('../groupscontroller');
var StudiesController = require('../studiescontroller');
var TestsController = require('../testscontroller');

function Log(message){
	if(config.LTI.loggerActive){
		logger.info('\x1b[33m%s\x1b[0m', message);
	}
}

// #################################################################
// ######################## LTI TOOL SERVER ########################
// #################################################################

// Require Provider 

// Setup provider
lti.setup(config.LTI.platform.key, // Key used to sign cookies and tokens
  { // Database configuration
    url: config.mongo.url
  },
  {
    cookies: {
      secure: true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: 'None' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: false, // Set DevMode to false if running in a production environment with https
    dynRegRoute: '/register', // Setting up dynamic registration route. Defaults to '/register'
    dynReg: {
      url: config.api.url + '/lti/tool/', // Tool Provider URL. Required field.
      name: 'SIMVA', // Tool Provider name. Required field.
      logo: config.favicon_url, // Tool Provider logo URL.
      description: 'SIMple VAlidation service for serious game validation and deployment', // Tool Provider description.
      redirectUris: [
        config.api.url,
        config.api.url + '/lti/tool/',
        config.api.url + '/lti/tool/*'
      ],
      autoActivate: true // Whether or not dynamically registered Platforms should be automatically activated. Defaults to false.
    }
  }
)

// Set lti launch callback
lti.onConnect(async (token, req, res) => {
  Log('lib/tool/lti.onConnect(): Started');
  Log('lib/tool/lti.onConnect(): Token:' + JSON.stringify(token));
  let response = {};

  try{
    let user = null;
    let platform = null;

    let users = await UsersController.getUsers(
      {
        'external_entity.domain': token.iss.toString(),
        'external_entity.id': token.user.toString()
      }
    );

    if(users.length > 0){
      Log('lib/tool/lti.onConnect(): user exists');
      user = users[0];
    }else{
      Log('lib/tool/lti.onConnect(): new user');
      let username = token.user + '_' + token.platformId;
      let email = null;

      if(token.userInfo && token.userInfo.email){
        email = token.userInfo.email;
      }else{
        email = token.user + '@' + token.clientId + '.com';
      }

      user = await UsersController.addUser({
        username: username,
        email: email,
        password: token.user,
        role: 'student',
        email: token.userInfo.email,
        external_entity: [
          { 
            id: token.user.toString(),
            domain: token.iss.toString()
          }
        ]
      });
    }

    
    let query = { 'link.type': 'lti_platform', 'link.id': token.platformId };
    let groups = await GroupsController.getGroups(query);
    Log('lib/tool/lti.onConnect(): Groups: ' + JSON.stringify(groups));

    let group = null;

    if(groups.length > 0){
      group = groups[0];
    }else{
      let groupbody = {
        name: 'LTI:' + token.clientId,
        owners: [],
        participants: [],
        link: { 
          type: 'lti_platform',
          id: token.platformId
        },
        created: Date.now()
      };

      Log('lib/tool/lti.onConnect(): Adding Group: ' + JSON.stringify(groupbody));
      group = await GroupsController.addGroup(groupbody);
      Log('lib/tool/lti.onConnect(): Group Added: ' + JSON.stringify(group));

      Log('lib/tool/lti.onConnect(): Query: ' + JSON.stringify(req.query));
      let ltik = jwt.decode(req.query.ltik, { complete: true });
      Log('lib/tool/lti.onConnect(): LTIK: ' + JSON.stringify(ltik));
      Log('lib/tool/lti.onConnect(): Body: ' + JSON.stringify(req.body));



      Log('lib/tool/lti.onConnect(): HOW ARE WE LINKING THE STUDY??');
      /*let study = await StudiesController.getStudy(req.query.study);


      study.groups.push(group._id);

      await StudiesController.updateStudy(study._id, study);*/
    }

    if(!group.participants.includes(user.username)){
      Log('lib/tool/lti.onConnect(): user not in group');
      group.participants.push(user.username);

      Log('lib/tool/lti.onConnect(): updating group');
      await GroupsController.updateGroup(group._id, group);

      Log('lib/tool/lti.onConnect(): obtaining study');
      let study = await StudiesController.getStudy(platform.studyId.toString());

      for (var i = 0; i < study.tests.length; i++) {
        Log('lib/tool/lti.onConnect(): updating participants for test ' + study.tests[i]);
        await TestsController.addParticipants(study.tests[i], [ user.username ]);
      }
    }

    Log('lib/tool/lti.onConnect(): getting jwt');
    let jwt = await UsersController.generateJWT(user);

    let redirection = config.external_url + '/users/login'
      + '?jwt=' + jwt
      + '&next=' + encodeURI(config.external_url + '/scheduler/' + platform.studyId);

      Log('lib/tool/lti.onConnect(): Redirection URL: ' + redirection);
    return res.redirect(redirection);
  }catch(e){
    Log('lib/tool/lti.onConnect(): Error: ' + JSON.stringify(e));
  }
  
  return res.send(response);
})

lti.onDynamicRegistration(async (req, res, next) => {
  Log('lib/tool/lti.onDynamicRegistration(): Started');
  try {
    if (!req.query.openid_configuration){
      let err = { message: 'Missing parameter: "openid_configuration".' };

      Log('lib/tool/lti.onDynamicRegistration(): Error : ' + JSON.stringify(err));
      return res.status(400).send({ status: 400, error: 'Bad Request', details: err })
    }
      
    const message = await lti.DynamicRegistration.register(req.query.openid_configuration, req.query.registration_token);

    Log('lib/tool/lti.onDynamicRegistration(): Success');
    res.setHeader('Content-type', 'text/html')
    res.send(message)
  } catch (err) {
    Log('lib/tool/lti.onDynamicRegistration(): Error: ' + JSON.stringify(err));

    if (err.message === 'PLATFORM_ALREADY_REGISTERED'){
      return res.status(403).send({ status: 403, error: 'Forbidden', details: { message: 'Platform already registered.' } })
    }
    return res.status(500).send({ status: 500, error: 'Internal Server Error', details: { message: err.message } })
  }
})

lti.onDeepLinking(async (token, req, res) => {
  Log('lib/tool/lti.onDeepLinking(): Started');
  Log('lib/tool/lti.onDeepLinking(): Token:' + JSON.stringify(token));

  let content = requireText('./base.html', require);
  let baseurl = config.external_url + '/scheduler/';
  let toreplace = '';

  let users = await UsersController.getUsers(
    {
      'external_entity.domain': token.iss.toString(),
      'external_entity.id': token.user.toString()
    }
  );

  if(users.length > 0){
    Log('lib/tool/lti.onDeepLinking(): user exists');
    user = users[0];
  }else{
    Log('lib/tool/lti.onDeepLinking(): new user');
    let username = token.user + '_' + token.platformId;
    let email = null;

    if(token.userInfo && token.userInfo.email){
      email = token.userInfo.email;
    }else{
      email = token.user + '@' + token.clientId + '.com';
    }

    user = await UsersController.addUser({
      username: username,
      email: email,
      password: token.user,
      role: 'student',
      email: token.userInfo.email,
      external_entity: [
        { 
          id: token.user.toString(),
          domain: token.iss.toString()
        }
      ]
    });
  }

  let moodletoken = await UsersController.generateJWT(user);

  // Check if the user has studies
  let query = { owners : { "$in" : await UsersController.getEffectiveUsernames(user) } };
  let studies = await StudiesController.getStudies(query);

  // If it has studiesd
  if(studies.length > 0){
    toreplace = '<div class="separator"><h2>Select an study for the activity</h2></div><ul>';
    for (var i = 0; i < studies.length; i++) {
      let item = [{
        type: 'ltiResourceLink',
        title: studies[i].name,
        url: baseurl /*+ '?study='*/ + studies[i]._id,
        custom: {
          resourceurl: baseurl /*+ '?study='*/ + studies[i]._id,
          resourcename: studies[i].name,
        }
      }];

      Log('lib/tool/lti.onDeepLinking(): Item: ' + JSON.stringify(item));

      try{
        Log('lib/tool/lti.onDeepLinking(): Successfully registered');
        let message = await lti.DeepLinking.createDeepLinkingMessage(token, item, { message: 'Successfully registered resource!' });
      }catch(e){
        Log('lib/tool/lti.onDeepLinking(): Error: ' + JSON.stringify(e));
      }

      toreplace += '<form id="ltijs_submit" class="submitable" action="' + token.platformContext.deepLinkingSettings.deep_link_return_url + '" method="post">'
              + '<input type="hidden" name="JWT" value="' + message + '">'
              + '<li>' + studies[i].name + '</li></form>';
    }
    toreplace += '</ul>';
  }else{
    toreplace = requireText('./loginform.html', require);
  }

  content = content.replace("<TOKEN>", moodletoken);
  content = content.replace("<CONTENT>", toreplace);

  return res.send(content);
});

const setup = async () => {
  Log('lib/tool/lti.setup(): started');
  try{
    await lti.deploy({ serverless: true });
    Log('lib/tool/lti.setup(): Success! Deployed');
  }catch(e){
    Log('lib/tool/lti.setup(): error deploying the server');
  }
}

module.exports = {
  provider: lti,
  setup: setup
};


// #################################################################