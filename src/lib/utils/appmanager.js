const logger = require('../logger');
const express = require('express');
const http = require('http');

AppManager = {};

AppManager.app = null;
AppManager.server = null;

AppManager.InitApp = function(){
	AppManager.app = express();
	AppManager.server = http.createServer(AppManager.app);
	return AppManager.app;
}

AppManager.getApp = function(){
	return AppManager.app;
}

AppManager.getServer = function(){
	return AppManager.server;
}

module.exports = AppManager;