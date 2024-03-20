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
		console.info('\x1b[33m%s\x1b[0m', message);
	}
}

// #################################################################
// ######################## LTI TOOL SERVER ########################
// #################################################################

// Require Provider 

// Setup provider
lti.setup("-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAuGiNxEv4setdXIy34+eW6Naazm5hqqccPe128iWa9F6jCGJa\npHmz3a88TK+bZH6i1nFF3fU02Ct9hr8uTjrjALlHQo9Fq6CuWX00oeZmemTqG3Kj\nH6tn1M3Jc6fNeMBV5VvnuYPNbC1k0uDU6pfx9xCIM+okkMiXhCWVYylXEPI6mYbp\nYP9ySDsIN+BNmeYs/iZ0ndz56Yl6lCxbz4lPM77Ni1o0gYqzOKXxTvOjRWhV3cei\nYTtvUaBfGIpuzGFpDWh2k8cN/NDeBSZMMW1OKYCrWEx5YnmbD8RWOOmzz9+9uTUK\n+7WPmVwpInA7bm2BC0eDmRtCesq0f2V1CK7UUQIDAQABAoIBABqcM8DcuaFq9kjx\noWOIurUUqrgZI4zNmnyxNJXSqV6T/XCrSKstSLA3pjrmqETDJVpOdCeIR7zd4bo9\nAkCVrMYg9lB7fjE6+Y2+TIcESUtmHoYhb7qVMGF75JME5tiC4KI9Nd4GT/FJR6BK\ng07q6CafwxfCtM4TtBGEnt71SzQNkXlPIaPGXCjlOo4ZCMKaHmiaNM7MNlOV6jTd\naCw63tSYLSAFdmNqSLx3mpSV6Oz9rm2Ke88WYoPTqkyt8xwAsUC+fv3mwV4/y4TZ\nlvat9VjD1tt0Yb78ZEwS1PL/nPUnmZ9LIweX1K4A/J3stXYpzrL35h96PZ1zs0p9\nmW5CgfECgYEA4XUHfZ/rE7ZGMKzjsV7/WbFU5OwQQv9TZ56MtFg1SfKQcmnhB9HF\noyhZT2WBe5WaRxzlx776k6N+pnihLPfqRon5SDkqpfKODXy8UAIKlhrxz7VvxydP\nP9NmnB+VcJuG647GvgVo4qKyMq81YlwEdRsvbjhklfZs8ymk3lG4+LUCgYEA0WPu\n5WirVwmtEUYvqv421/2fXNSAsun89lNSsYTVvOJa5L+uVChm78ao93KYhrtY6jP8\nX4EkQYnaamkPkReF2pqc6MYH+ZFV2drB96FMQBBCJu/Jy8Zvs6kaNsmX1IWfbN+C\nBp1g8ZAoxLKzMLNcU9dxvI0gG89Jg45pnYNW+q0CgYBQVLl5ilxhJqX1u/RZA4cq\nNyQPeQkGRiE6n2R08aTzFyleitkyRw0LaFoCDyHGnfRdeC9rL2Hq7us2d26+Lgtc\nXNbkY/INNNJmfdY/D6sj9q/IGVadeCUlkbZS1HITsGavUa0Akb7gWaXypzj3NeAk\nta39sLwuLqJ9NY5X5HhqrQKBgB2bpuUzhr7Y9Grz5LumFLU3/LfQqJ4j7gwavh+x\n69M4oqej3w+xYtTW33+V6bFrfmgnj7Elfq3xwzu2vWfDzr6ZjERx9CC7B0u13iWY\n3kJUyjXdREiXN6ZM7BMBMIHxnxhzBlzPFi0yOEGQDzx8sDp+xWtm/TpRdlCu64pF\nTyBFAoGAVpEyC2FPn+OVspw6LWY78ape6QgNAA2UV2bJ7/ZTgBz2cJNpeJZPnBZM\nZuynQAf68ntCD2qDfC0k3T9Hh4QTykpk7HPf2oBoDR2tSazXXNZH/8fZmNIlmCle\nCi6IK1rO8892hN9Y6SgOaSvemxLBmm3yns+I+/bFxZYWftdWpEo=\n-----END RSA PRIVATE KEY-----", // Key used to sign cookies and tokens
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