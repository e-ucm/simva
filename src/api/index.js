const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const multiparty = require('multiparty');
const formidable = require('formidable');
const config = require('../lib/config');
const logger = require('../lib/logger');
const AppManager = require('../lib/utils/appmanager');
const SchemaValidationError = require('express-body-schema/SchemaValidationError'); 

var isTest = (process.env.NODE_ENV === 'test');

console.log(isTest);

let createAdminUser = async function(){
  let UsersController = require('../lib/userscontroller');

  let result = await UsersController.getUsers({ username: config.api.adminUsername });

  if(result.length > 0){
    console.log('## Admin user already exists');
    console.log(result);
  }else{
    let result = await UsersController.addUser({
      username: config.api.adminUsername,
      password: config.api.adminPassword,
      email: config.api.adminEmail,
      role: 'admin'
    });

    console.log('## Admin user created:');
    console.log(result);
    console.log('######################');
  }
}

var mongoose = require('mongoose');
mongoose.connect( !isTest ? config.mongo.url : config.mongo.test, {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected');

  	const fs = require('fs');
	const yaml = require('yaml');
	const swaggerMongoose = require('swagger-mongoose');

	const descriptor = yaml.parse(fs.readFileSync('./api.yaml', 'utf8'));
	swaggerMongoose.compile(JSON.stringify(descriptor));

  createAdminUser();
});

let multipartwith

const log = logger(config.logger);

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
        console.log(req.files);
        let filekeys = Object.keys(req.files);
        console.log(filekeys);
        for (var i = 0; i < filekeys.length; i++) {
          if(req.files[filekeys[i]].mimetype === 'application/json'){
            console.log(req.files[filekeys[i]].data);
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
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
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


// catch 404
app.use((req, res, next) => {
  log.error(`Error 404 on ${req.url}.`);
  console.log(req.url);
  res.status(404).send({ message: 'Not found' });
});

// catch errors
app.use((err, req, res, next) => {
  if(err instanceof SchemaValidationError){
    log.error(`Bad request (${err.message}) on ${req.method} ${req.url} with payload ${req.body}.`);
    res.status(400).send({ message: err.message });
  }else{
    console.log(err);
    const status = err.status || 500;
    const msg = err.error || err.message;
    log.error(`Error ${status} (${msg}) on ${req.method} ${req.url} with payload ${req.body}.`);
    res.status(status).send({ message: msg });
  }
});

module.exports = app;
