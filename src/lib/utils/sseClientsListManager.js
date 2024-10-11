var StudiesController = require("../studiescontroller");

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


    getClientList(activityId, participant) {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = JSON.parse(clientData); // Parse the stored client data
            let activities = []; //StudiesController.getActivitiesInStudy(client.id);
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
        console.log(this.clients);
        return clientsToSend;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
    }
}

module.exports = new SSEClientsListManager();