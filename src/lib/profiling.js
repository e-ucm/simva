const config = require('./config.js');
const path = require('path');
const logger = require("./logger.js");
const ms = require('ms');

if(process.env.NODE_ENV == "development" && config.api.profiling) {
  logger.info("Profiling in progress...");
}