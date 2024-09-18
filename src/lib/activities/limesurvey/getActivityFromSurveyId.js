var async=require("async");
const logger = require('../../logger');
var mongoose = require('mongoose');
const ActivitiesController = require("../../activitiescontroller");

async function getActivityFromSurveyId(surveyid) {
    let activities = await ActivitiesController.getActivities({ type : "limesurvey" });
    
    logger.info("Survey ID: " + surveyid);
    // Find the activity IDs where extra_data.surveyId matches the given surveyid
    // Cast each activity to its specific class
    const castedActivities = activities.map(activity => ActivitiesController.castToClass(activity));

    // Filter and map to find matching activities
    const matchingActivities = castedActivities
        .filter(activity => activity.extra_data && activity.extra_data.surveyId == surveyid);

    // Return the matching IDs (or an empty array if no matches are found)
    return matchingActivities;
}

module.exports = getActivityFromSurveyId;