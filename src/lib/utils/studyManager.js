var StudyManager={}

StudyManager.getActivitiesInStudy = async (studyId) => {
    var StudiesController = require("../studiescontroller"); // Import when needed
    return await StudiesController.getActivitiesInStudy(studyId);
}

module.exports = StudyManager;