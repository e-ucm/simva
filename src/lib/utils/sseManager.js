var sseClientManager = require('./sseClientsListManager');

// sseManager.js
class SSEManager {
    constructor() {
        this.clients = new Map();  // Track connected clients by a unique client ID
        this.clientsOptions = new Map();
    }

    // Handle a new SSE client connection
    addClient(req, res) {
        const clientId = this.generateClientId();

        // Set the required headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Add client to the client list
        this.clients.set(clientId, res);
        console.log(`Client connected: ${clientId}`);

        // Handle client disconnect
        req.on('close', () => {
            console.log(`Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
            sseClientManager.removeClient(clientId);
        });

        return clientId;  // Return client ID for reference
    }

    // Generate a unique client ID
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Send a message to a specific client list
    sendMessageToClientList(clientList, message, type) {
        for(var i=0; i < clientList.length; i++) {
			this.sendMessageToClient(clientList[i], message, type);
		}
    }

    // Send a message to a specific client
    sendMessageToClient(clientId, message, type) {
        const client = this.clients.get(clientId);
        if (client) {
            var msg="";
            if(type) {
                msg=`event:${type}\n`
            }
            msg+=`data: ${JSON.stringify(message)}\n\n`
            client.write(msg);
        } else {
            console.error(`Cannot send message. Client ${clientId} is not connected.`);
        }
    }

    // Broadcast a message to all connected clients
    broadcast(message, type) {
        this.clients.forEach((client, clientId) => {
            var msg="";
            if(type) {
                msg=`event:${type}\n`
            }
            msg+=`data: ${JSON.stringify(message)}\n\n`
            client.write(msg);
        });
    }

    // Get the total number of connected clients (optional utility)
    getClientCount() {
        return this.clients.size;
    }

    // Get the total number of connected clients (optional utility)
    getClientConnected(clientId) {
        return this.clients.has(clientId);
    }
}

module.exports = new SSEManager();
