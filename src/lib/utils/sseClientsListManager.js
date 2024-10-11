// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients= new Map();
        this.clientsStudy = new Map(); 
        this.clientsUsers = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        var obj = { user : user, userrole : userRole, activityId : id};
        this.clients.set(clientId, JSON.stringify(obj));
        this.clientsStudy.set(id, clientId);
        this.clientsUsers.set(user, clientId);
        console.log(this.clients);
    }


    getClientList(activityId, participant) {
        let clientsToSend = [];
        console.log(this.clients);
        return clientsToSend;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
    }

    remove(user) {
        this.clientsUsers.delete(user);
    }
}

module.exports = new SSEClientsListManager();