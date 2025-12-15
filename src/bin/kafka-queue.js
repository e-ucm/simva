var config = require('../lib/config.js');
var logger = require('../lib/logger.js');
var mongoose = require('mongoose');
logger.info('Connecting to MongoDB');
logger.info(`Connecting to MongoDB ${config.mongo.url}`);
const isTest = (process.env.NODE_ENV !== 'production');
mongoose.set('debug', isTest);
mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err);
});
mongoose.connect( config.mongo.url, {useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 30000});

const db = mongoose.connection;
db.on('error', logger.error.bind(logger, 'MongoDB connection error:'));
db.once('open', async function() {
    logger.debug('MongoDB connected');
    var models = require("../lib/models.js");
    for (const [name, schema] of Object.entries(models)) {
      logger.info(`Registering schema ${name} into Mongoose...`);
      // schema is a Mongoose model
      mongoose.model(name, schema.schema); // explicitly register
    }
    // Now you can require your Kafka task module safely
    require("../lib/utils/SimvaTaskToKafka.js");
});

process.on('SIGINT', async () => {
  console.log('Shutting down DB pool...');
  const db = require('../lib/db');
  await db.end();
  process.exit(0);
});