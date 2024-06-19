const logger = require('../logger');
const express = require('express');

AppManager = {};

AppManager.app = null;

AppManager.InitApp = function(){
	AppManager.app = express();
	return AppManager.app;
}

AppManager.getApp = function(){
	return AppManager.app;
}

module.exports = AppManager;