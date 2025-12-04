const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const multiparty = require('multiparty');
const formidable = require('formidable');
const config = require('../lib/config');
const logger = require('../lib/logger');
const profiling = require('../lib/profiling');
const crypto = require("crypto");

const AppManager = require('../lib/utils/appmanager');
const SchemaValidationError = require('express-body-schema/SchemaValidationError'); 

var isTest = (process.env.NODE_ENV !== 'production');

logger.debug(isTest);
logger.debug(JSON.stringify(config));

let createAdminUser = async function(){
  let UsersController = require('../lib/userscontroller');
  let adminUsername = config.api.adminUsername.toLowerCase();
  let result = await UsersController.getUsers({ username: adminUsername });

  if(result.length > 0){
    logger.info('## Admin user already exists');
    logger.info(result);
  }else{
    let result = await UsersController.addUser({
      username: adminUsername,
      password: config.api.adminPassword,
      email: config.api.adminEmail,
      role: 'admin'
    });

    logger.info('## Admin user created:');
    logger.info(result);
    logger.info('######################');
  }
}

var mongoose = require('mongoose');
const sendSimvaEventsToKafka = require('../lib/utils/SimvaEventsToKafka');
const getActivityFromSurveyId = require('../lib/activities/limesurvey/getActivityFromSurveyId');
mongoose.connect( !isTest ? config.mongo.url : config.mongo.test, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', logger.error.bind(console, 'connection error:'));
db.once('open', function() {
  logger.debug('connected');
  const fs = require('fs');
	const yaml = require('yaml');
	const swaggerMongoose = require('swagger-mongoose');

	const descriptor = yaml.parse(fs.readFileSync('./api.yaml', 'utf8'));
	swaggerMongoose.compile(JSON.stringify(descriptor));

  createAdminUser();
  let StudiesController = require('../lib/studiescontroller');
  StudiesController.updateStudyIdInTestsAndActivitiesMigration().then(() => {
      logger.info('Migration completed.');
    }).catch(err => {
      logger.error('Migration failed: ' + err);
    });
});



let multipartwith

const app = AppManager.InitApp();
app.use(bodyParser.json({limit: config.api.maxUploadFileSize}));
app.use(bodyParser.urlencoded({limit: config.api.maxUploadFileSize, extended: true}));

/*app.use(
  //fileUpload({ limits: { fileSize: 200 * 1024 * 1024 }}),
  function(req, res, next){
    const form = formidable({ multiples: true });
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }
      res.json({ fields, files });
    });
    try {
      new multiparty.Form().parse(req, (err, fields, files) => {
        if(!err){
          req.fields = fields;
          req.files = files;
          next();
        }else if(err.constructor.name !== 'UnsupportedMediaTypeError'){
          next(err);
        }else{
          next();
        }
      });
    } catch (err) {
      next(err);
    }
  },
  function(req, res, next){
    if((req.method === 'POST' || req.method === 'PUT') && (!req.body || Object.keys(req.body).length === 0)){
      if(req.files){
        logger.debug(req.files);
        let filekeys = Object.keys(req.files);
        logger.debug(filekeys);
        for (var i = 0; i < filekeys.length; i++) {
          if(req.files[filekeys[i]].mimetype === 'application/json'){
            logger.debug(req.files[filekeys[i]].data);
            req.body = JSON.parse(req.files[filekeys[i]].data);
          }
        }
      }
    }

    next();
});*/

// ALLOW CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, x-experience-api-version');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    next();
});

/*
 * Routes
 */
app.use('/users', require('./routes/users'));
app.use('/groups', require('./routes/groups'));
app.use('/studies', require('./routes/studies'));
app.use('/activities', require('./routes/activities'));
app.use('/activitytypes', require('./routes/activitytypes'));
app.use('/allocatortypes', require('./routes/allocatortypes'));
app.use('/lti', require('./routes/lti'));

verifyHookdeckSignature = async function(
  req,
  res,
  next
) {
  if (!config.limesurvey.SECRET) {
    console.warn(
      "No Hookdeck Signing Secret: Skipping webhook verification. Do not do this in production!"
    );
    return next();
  }

  const headers= {};
  const incomingHeaders = req.headers;

  for (const [key, value] of Object.entries(incomingHeaders)) {
    headers[key] = value;
  }
  logger.info(headers);

  const rawBody = req.body;
  logger.info(rawBody);
  logger.info(JSON.stringify(rawBody));

  const conf={
    checkSourceVerification: false,
  };
  const result = validatePayload(headers,
    rawBody,
    conf
  );

  if (!result.isValidSignature) {
    logger.info("Signature is invalid, rejected");
    res.sendStatus(401);
  } else {
    logger.info("Signature is valid, accepted");
    next();
  }
};

//Validate payload
function validatePayload(headers, rawBody, conf) {
  if (headers[config.limesurvey.headerName]) {
    //Extract Signature header
    const signature = headers[config.limesurvey.headerName] || "";
    logger.info(signature);
    const sig = Buffer.from(signature);

    //Calculate HMAC
    const hmac = crypto.createHmac("sha256", config.limesurvey.SECRET);
    const digest = Buffer.from(
      config.limesurvey.headerPrefix + hmac.update(JSON.stringify(rawBody)).digest("hex"),
      "utf8",
    );
    logger.info(digest.toString());

    //Compare HMACs
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return { isValidSignature: false };
    } else {
      return { isValidSignature: true };
    }
  }
  return { isValidSignature: false };
}

app.post('/limesurvey-completion-webhooks', verifyHookdeckSignature, async (req, res) => {
  logger.info(JSON.stringify(req.body));
  var type;
  if(req.body.event == "beforeSurveyPage") {
    type='activity_initialized';
  } else if(req.body.event == "afterSurveyComplete") {
    type='activity_completed';
  } else {
    res.status(200).send({ message: 'Event not treated.' });
  };
  let surveyId = req.body.event_details.surveyId;
  let activities = await getActivityFromSurveyId(surveyId);
  let messages = [];
  for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const message = {
          type: type,
          activityType: "limesurvey",
          surveyId: surveyId,
          activityId: activity._id,
          studyId: activity.study,
          user: req.body.event_details.token
      };
      messages.push(message);
  }
  if(messages.length > 0) {
    logger.info(JSON.stringify(messages));
    sendSimvaEventsToKafka(messages);
  }
  res.status(200).send({ message: 'Message treated' });
});

// catch 404
app.use((req, res, next) => {
  logger.error(`Error 404 on ${req.url}.`);
  logger.error(req.url);
  res.status(404).send({ message: 'Not found' });
});

// catch errors
app.use((err, req, res, next) => {
  if(err instanceof SchemaValidationError){
    logger.error(`Bad request (${err.message}) on ${req.method} ${req.url} with payload ${JSON.stringify(req.body)}.`);
    res.status(400).send({ message: err.message });
  }else{
    logger.error(err);
    const status = err.status || 500;
    const msg = err.error || err.message;
    logger.error(`Error ${status} (${msg}) on ${req.method} ${req.url} with payload ${JSON.stringify(req.body)}.`);
    res.status(status).send({ message: msg });
  }
});

module.exports = app;
