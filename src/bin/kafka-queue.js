var mongoose = require('mongoose');
var config = require('../lib/config.js');
var logger = require('../lib/logger.js');
const fs = require('fs');
const yaml = require('yaml');
async function start() {
    try {
        logger.info(`Connecting to MongoDB ${config.mongo.url}`);
        await mongoose.connect(config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info("MongoDB connected successfully");
    } catch (err) {
        logger.fatal(err, "MongoDB connection failed");
        process.exit(1); // stop process if DB connection fails
    }

    const swaggerMongoose = require('swagger-mongoose');
    // Load Swagger descriptor
    const descriptor = yaml.parse(fs.readFileSync('./api.yaml', 'utf8'));
    // Compile models and register them globally with Mongoose
    const models = await swaggerMongoose.compile(JSON.stringify(descriptor), { mongoose });
    // Example: access a model
    const User = mongoose.model('User'); // or models.User
    logger.info('User model ready:', User.modelName);
    // Now you can require your Kafka task module safely
    require("../lib/utils/SimvaTaskToKafka.js");
}

start();