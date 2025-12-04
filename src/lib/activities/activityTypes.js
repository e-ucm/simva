var Activity = require('./activity');
var LimeSurveyActivity = require('./LimeSurveyActivity');
var MinioActivity = require('./MinioActivity');
var GameplayActivity = require('./GameplayActivity');
var ManualActivity = require('./ManualActivity');
var LTIToolActivity = require('./LTIToolActivity');
var ImsPackageActivity = require('./ImsPackageActivity');

var activityTypes = [
	Activity,
	LimeSurveyActivity,
	/*MinioActivity, */
	GameplayActivity,
	ManualActivity,
	LTIToolActivity,
	ImsPackageActivity
];

module.exports = activityTypes;