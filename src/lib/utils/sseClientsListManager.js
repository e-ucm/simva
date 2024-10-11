var StudyManager = require("./studyManager"); 

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients= new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        var obj = { user : user, userRole : userRole, id : id};
        this.clients.set(clientId, JSON.stringify(obj));
        console.log(this.clients);
    }


    async getClientList(id, participant) {
        // If id is an ObjectID, convert it to a string
        const activityId = (id && typeof id.toHexString === 'function') ? id.toHexString() : id;
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = JSON.parse(clientData); // Parse the stored client data
            let activities = await StudyManager.getActivitiesInStudy(client.id);
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the activityId
                if (activities.includes(activityId)) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                }
            } else if (client.userRole === 'student') {
                if(client.user == participant) {
                    if (activities.includes(activityId)) {
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
}

module.exports = new SSEClientsListManager();