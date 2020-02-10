const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('../lib/config');
const logger = require('../lib/logger');
const SchemaValidationError = require('express-body-schema/SchemaValidationError'); 

var isTest = (process.env.NODE_ENV === 'test');

console.log(isTest);

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
	swaggerMongoose.compile(JSON.stringify(descriptor))
});

const log = logger(config.logger);
const app = express();

app.use(bodyParser.json({limit: '1mb'}));

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
