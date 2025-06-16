const logger = require('./logger');
const ServerError = require('./error');
var mongoose = require('mongoose');
let fs = require('fs');
var ObjectId = mongoose.Types.ObjectId;
var config = require('./config');
//var JsTracker = require("../../node_modules/js-tracker/src/js-tracker.js");
//var JsTracker = require("js-tracker");
class Study {
    constructor(params) {
        this.extra_data = {};
		this.owners = [];

		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
    }

	sendXAPITrace = async function(user,verb,studyId) {
		var tracker = new JsTracker(null,null,null,config.external_url,user);
		switch(verb) {
			case "Initialized":
				let statement = tracker.ScormTracker.Initialized(studyId);
				logger.info(statement.toXAPI());
				break;
			default:
				logger.info(verb);
		}
	}



};

// ##########################################
// Module exports
// ##########################################

module.exports = Study;