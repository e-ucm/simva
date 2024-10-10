// wsManager.js
const WebSocket = require('ws');

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map();  // Track connected clients (by ID, for example)
    }

    // Initialize WebSocket server
    init(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);
            console.log(`Client connected: ${clientId}`);

            // Handle messages from the client
            ws.on('message', (message) => {
                console.log(`Received message from client ${clientId}: ${message}`);
                this.handleMessage(clientId, message);
            });

            // Handle client disconnect
            ws.on('close', () => {
                console.log(`Client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });
        });
    }

    // Generate a unique client ID
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Handle incoming messages (example implementation)
    handleMessage(clientId, message) {
        // Process the message based on its content
        console.log(`Processing message from client ${clientId}: ${message}`);
    }

    // Send a message to a specific client
    sendMessageToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        } else {
            console.error(`Cannot send message. Client ${clientId} is not connected.`);
        }
    }

    // Broadcast a message to all connected clients
    broadcast(message) {
        this.clients.forEach((client, clientId) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // Get WebSocket server instance (if needed for other custom operations)
    getServer() {
        return this.wss;
    }
}

module.exports = new WebSocketManager();
