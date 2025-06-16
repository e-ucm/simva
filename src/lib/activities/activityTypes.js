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

function castActivityToClass(activity) {
	for (let i = 0; i < activityTypes.length; i++) {
		if(activityTypes[i].getType() == activity.type){
			let castedActivity = new activityTypes[i](activity);
			return castedActivity;
		}
	}
	return null;
}

module.exports = {activityTypes, castActivityToClass};