const fs = require('fs');
module.exports = {
  getToken: function (context, events, done) {
    let startTime=new Date();
    fs.appendFileSync('test-log.txt',`startTime : ${startTime.toISOString()} - Selected user: ${context.vars.username} - Token: ${context.vars.token}\n`);
    return done();
  },
  setURL: function (context, events, done) {
    fs.appendFileSync('test-log.txt',`Selected user: ${context.vars.username}\n`);
    // Dynamically generate the URL based on context variables
    context.vars.sso_token_url = `${context.vars.$env.SSO_URL}/realms/${context.vars.$env.SSO_REALM}/protocol/openid-connect/token`;
    context.vars.sso_url = `${context.vars.$env.SSO_URL}`;
    context.vars.sso_realm = `${context.vars.$env.SSO_REALM}`;
    context.vars.activity_url = `${context.vars.$env.API_URL}/activity/${context.vars.$env.ACTIVITY_ID}/statements`;
    context.vars.api_url = `${context.vars.$env.API_URL}`;
    context.vars.client_id = `${context.vars.$env.CLIENT_ID}`;
    context.vars.client_secret = `${context.vars.$env.CLIENT_SECRET}`;
    context.vars.study_id = `${context.vars.$env.STUDY_ID}`;
    context.vars.activity_id = `${context.vars.$env.ACTIVITY_ID}`;
    // Log the dynamic URL for debugging
    fs.appendFileSync('test-log.txt',`Generated URL => sso_token_url: ${context.vars.sso_token_url} - activity_url: ${context.vars.activity_url}\n`);
    fs.appendFileSync('test-log.txt',`client_id: ${context.vars.client_id} - client_secret: ${context.vars.client_secret} - study_id:${context.vars.study_id}\n`);
    return done();
  },
};
