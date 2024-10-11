var sseManager = require('./sseManager');

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients= new Map();
        this.clientsActivities = new Map(); 
        this.clientsUsers = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        this.clients.set(clientId, { user : user, userrole : userRole, activityId : id});
        this.clientsStudy.set(id, clientId);
        this.clientsUsers.set(user, clientId);
    }

    sendMessageToClient(activityId, participant, message) {
        let clientsToSend = [];
		for(var i=0; i < clientsToSend.length; i++) {
			sseManager.sendMessageToClient(clientsToSend[i], message);
		}
        console.log(this.clients);
        // Broadcast the message to all clients
		sseManager.broadcast(message);
    }

    remove(user) {
        this.clientsUsers.delete(user);
    }
}

module.exports = new SSEClientsListManager();