var StudyManager = require("./studyManager"); 

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients = new Map();
        this.surveys = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        var obj = { user : user, userRole : userRole, id : id};
        this.clients.set(clientId, JSON.stringify(obj));
        console.log(this.clients);
    }

    async getClientList(id, participant, type) {
        // If id is an ObjectID, convert it to a string
        var activityId = (id && typeof id.toHexString === 'function') ? id.toHexString() : id;
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = JSON.parse(clientData); // Parse the stored client data
            let activities = await StudyManager.getActivitiesInStudy(client.id);
            let activitiesId = [];
            let surveys=[];
            for(var i =0; i < activities.length; i++) {
                activitiesId.push(activities[i].id);
                if(activities[i].type == "limesurvey") {
                    surveys.push(parseInt(activities[i].extra_data.surveyId));
                    this.surveys.set(activities[i].extra_data.surveyId, activities[i].id);
                    console.log(this.surveys);
                }
            }
            if(type == "limesurvey") {
                activitiesId = surveys;
                activityId = (activityId && typeof activityId === 'string') ? parseInt(activityId) : activityId;
            }
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the activityId
                if (activitiesId.includes(activityId)) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                }
            } else if (client.userRole === 'student') {
                if(client.user == participant) {
                    if (activitiesId.includes(activityId)) {
                        clientsToSend.push(clientId); // Add to the list if conditions are met
                    }
                }
            } else {
                console.log(`Client ${clientId} is not authorized.`);
            }
        }
        return clientsToSend;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(this.clients);
    }

    getSurvey(survey) {
        var surveyId = (survey && typeof survey === 'string') ? parseInt(survey) : survey;
        var activityId = this.surveys.get(surveyId);
        return activityId;
    }

    removeSurvey(survey) {
        this.surveys.delete(survey);
        console.log(this.surveys);
    }
}

module.exports = new SSEClientsListManager();