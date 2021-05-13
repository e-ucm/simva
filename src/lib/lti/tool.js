var config = require('../config');
const lti = require('ltijs').Provider

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
    devMode: true // Set DevMode to false if running in a production environment with https
  }
)

// Set lti launch callback
lti.onConnect(async (token, req, res) => {
  console.log(token);

  let response = {};

  try{
    /*response.members = await lti.NamesAndRoles.getMembers(token);
    console.log(response.members);*/

    /*response.lineitems  = await lti.Grade.getLineItems(token)
    console.log(response.lineitems);

    response.lineitems  = await lti.Grade.createLineItem(res.locals.token, {
      scoreMaximum: 100,
      label: 'Grade',
      tag: 'grade'
    });*/
    
    /*await lti.Grade.scorePublish(res.locals.token, {
      scoreGiven: 50,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded'
    });

    console.log(response.lineitems);*/
  }catch(e){
    console.log(e);
  }
  
  return res.send(response);
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