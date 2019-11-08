const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('../lib/config');
const logger = require('../lib/logger');

var mongoose = require('mongoose');
mongoose.connect(config.mongo.url, {useNewUrlParser: true});
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
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

/*
 * Routes
 */
app.use('/users', require('./routes/users'));
app.use('/groups', require('./routes/groups'));
app.use('/studies', require('./routes/studies'));
app.use('/tests', require('./routes/tests'));
app.use('/activities', require('./routes/activities'));

// catch 404
app.use((req, res, next) => {
  log.error(`Error 404 on ${req.url}.`);
  console.log(req.url);
  res.status(404).send({ status: 404, error: 'Not found XXXX' });
});

// catch errors
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = err.error || err.message;
  log.error(`Error ${status} (${msg}) on ${req.method} ${req.url} with payload ${req.body}.`);
  res.status(status).send({ status, error: msg });
});


module.exports = app;
