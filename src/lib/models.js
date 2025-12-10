var mongoose = require('mongoose');
var logger = require('../lib/logger.js');
const fs = require('fs');
const yaml = require('yaml');
const swaggerMongoose = require('swagger-mongoose');
const path = require('path');

const apiPath = path.resolve(__dirname, '../../api.yaml');

try {
  const fileContent = fs.readFileSync(apiPath, 'utf8');
  console.log('✅ File read successfully:', apiPath);
  console.log('File contents (first 200 chars):', fileContent.slice(0, 200)); // preview
  const descriptor = yaml.parse(fileContent);
  console.log('✅ YAML parsed successfully');
  // Compile models and register them globally with Mongoose
  const compiled = swaggerMongoose.compile(descriptor);
  module.exports=compiled.models;
} catch (err) {
  console.error('❌ Failed to read or parse YAML file:', apiPath, err);
}