process.env.DEBUG = '*';

var mongoose = require('mongoose');
var config = require('../config');
const lti = require('ltijs').Provider;

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
    dynRegRoute: '/register', // Setting up dynamic registration route. Defaults to '/register'
    dynReg: {
      url: 'http://simva-api.simva.e-ucm.es', // Tool Provider URL. Required field.
      name: 'Simva', // Tool Provider name. Required field.
      logo: 'https://simva.e-ucm.es/logo_text.png', // Tool Provider logo URL.
      description: 'SIMple VAlidation service for serious game validation and deployment', // Tool Provider description.
      redirectUris: ['http://simva-api.simva.e-ucm.es', 'http://simva-api.simva.e-ucm.es'], // Additional redirection URLs. The main URL is added by default.
      autoActivate: true // Whether or not dynamically registered Platforms should be automatically activated. Defaults to false.
    }
  }
)

// Set lti launch callback
lti.onConnect(async (token, req, res) => {
  console.log(token);

  let response = {};

  try{
    console.log('trying');
    let users = null;
    let user = null;
    let platform = null;

    if(token.userInfo && token.userInfo.email){
      console.log('obtaining by email');
      users = await UsersController.getUsers({ email: token.userInfo.email }); 
    }else{
      console.log('obtaining by username');
      users = await UsersController.getUsers({ username: token.user }); 
    }

    console.log('user obtained');

    if(users.length > 0){
      console.log('user exists');
      user = users[0];
    }else{
      console.log('new user');
      let username = token.user;
      let email = null;

      if(token.userInfo && token.userInfo.email){
        console.log('adding with email');
        email = token.userInfo.email;
      }else{
        console.log('adding with username');
        email = token.user + '@dummy.com';
      }

      user = await UsersController.addUser({
        username: username,
        email: email,
        password: token.user,
        role: 'student',
        email: token.userInfo.email
      });

      console.log(user);

      console.log('user added');
    }

    console.log('getting platform');
    let platforms = await mongoose.model('lti_platform').find({ url: token.iss, clientId: token.clientId });
    if(platforms.length > 0){
      platform = platforms[0];

      console.log('getting group');
      let query = { 'link.type': 'lti_platform', 'link.id': platform._id };
      let groups = await GroupsController.getGroups(query);
      console.log(groups);


      if(groups.length > 0){
        let group = groups[0];

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
      }
    }

    console.log('getting jwt');
    let jwt = await UsersController.generateJWT(user);

    let redirection = 'https://simva.e-ucm.es/users/login'
      + '?jwt=' + jwt
      + '&next=' + encodeURI('https://simva.e-ucm.es/scheduler/' + platform.studyId);

    console.log(redirection);
    return res.redirect(redirection);
  }catch(e){
    console.log(e);
  }
  
  return res.send(response);
})

lti.onDynamicRegistration(async (req, res, next) => {
  try {
    console.log(req);
    console.log(res);
    if (!req.query.openid_configuration) return res.status(400).send({ status: 400, error: 'Bad Request', details: { message: 'Missing parameter: "openid_configuration".' } })
    const message = await lti.DynamicRegistration.register(req.query.openid_configuration, req.query.registration_token)
    res.setHeader('Content-type', 'text/html')
    res.send(message)
  } catch (err) {
    if (err.message === 'PLATFORM_ALREADY_REGISTERED') return res.status(403).send({ status: 403, error: 'Forbidden', details: { message: 'Platform already registered.' } })
    return res.status(500).send({ status: 500, error: 'Internal Server Error', details: { message: err.message } })
  }
})

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