process.env.DEBUG = '*';

var mongoose = require('mongoose');
var config = require('../config');
const lti = require('ltijs').Provider;
var requireText = require('require-text');

var UsersController = require('../userscontroller');
var GroupsController = require('../groupscontroller');
var StudiesController = require('../studiescontroller');
var TestsController = require('../testscontroller');

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
    dynRegRoute: config.api.url + '/lti/register', // Setting up dynamic registration route. Defaults to '/register'
    dynReg: {
      url: config.api.url + '/lti/tool/', // Tool Provider URL. Required field.
      name: 'SIMVA', // Tool Provider name. Required field.
      logo: config.api.url + '/favicon.ico', // Tool Provider logo URL.
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
  let response = {};

  try{
    console.log('trying');
    let user = null;
    let platform = null;

    let users = await UsersController.getUsers(
      {
        'external_entity.domain': token.iss.toString(),
        'external_entity.id': token.user.toString()
      }
    );

    if(users.length > 0){
      console.log('user exists');
      user = users[0];
    }else{
      console.log('new user');
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

    
    let query = { 'link.type': 'lti_platform', 'link.id': token.platformId + '_' + token.deploymentId };
    let groups = await GroupsController.getGroups(query);
    console.log(groups);

    let group = null;

    if(groups.length > 0){
      group = groups[0];
    }else{
      group = await GroupsController.addGroup({
        name: 'LTI:' + token.clientId,
        owners: [],
        participants: [],
        link: { 
          type: 'lti_platform',
          id: token.platformId + '_' + token.deploymentId
        },
        created: Date.now()
      });

      console.log(JSON.stringify(req.query));
      let study = await StudiesController.getStudy(req.query.study);


      study.groups.push(group._id);

      await StudiesController.updateStudy(study._id, study);
    }

    if(!group.participants.includes(user.username)){
      console.log('user not in group');
      group.participants.push(user.username);

      console.log('updating group');
      await GroupsController.updateGroup(group._id, group);

      console.log('obtaining study');
      let study = await StudiesController.getStudy(platform.studyId.toString());

      for (var i = 0; i < study.tests.length; i++) {
        console.log('updating participants for test ' + study.tests[i]);
        await TestsController.addParticipants(study.tests[i], [ user.username ]);
      }
    }

    console.log('getting jwt');
    let jwt = await UsersController.generateJWT(user);

    let redirection = config.external_url + '/users/login'
      + '?jwt=' + jwt
      + '&next=' + encodeURI(config.external_url + '/scheduler/' + platform.studyId);

    console.log(redirection);
    return res.redirect(redirection);
  }catch(e){
    console.log(e);
  }
  
  return res.send(response);
})

lti.onDynamicRegistration(async (req, res, next) => {
  try {
    if (!req.query.openid_configuration) return res.status(400).send({ status: 400, error: 'Bad Request', details: { message: 'Missing parameter: "openid_configuration".' } })
    const message = await lti.DynamicRegistration.register(req.query.openid_configuration, req.query.registration_token)
    res.setHeader('Content-type', 'text/html')
    res.send(message)
  } catch (err) {
    if (err.message === 'PLATFORM_ALREADY_REGISTERED') return res.status(403).send({ status: 403, error: 'Forbidden', details: { message: 'Platform already registered.' } })
    return res.status(500).send({ status: 500, error: 'Internal Server Error', details: { message: err.message } })
  }
})

lti.onDeepLinking(async (token, req, res) => {
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
    console.log('user exists');
    user = users[0];
  }else{
    console.log('new user');
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

      console.log(item);
      console.log(token);

      try{
        let message = await lti.DeepLinking.createDeepLinkingMessage(token, item, { message: 'Successfully registered resource!' });
      }catch(e){
        console.log(e);
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
  console.log('LTIJS: started');
  try{
    await lti.deploy({ serverless: true });
    console.log("LTIJS: deployed");
  }catch(e){
    console.log('LTIJS: error deploying the server');
    console.log(e);
  }
}

module.exports = {
  provider: lti,
  setup: setup
};

// #################################################################