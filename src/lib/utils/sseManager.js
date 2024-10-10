// sseManager.js
class SSEManager {
    constructor() {
        this.clients = new Map();  // Track connected clients by a unique client ID
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
        });

        return clientId;  // Return client ID for reference
    }

    // Generate a unique client ID
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Send a message to a specific client
    sendMessageToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client) {
            client.write(`data: ${JSON.stringify(message)}\n\n`);
        } else {
            console.error(`Cannot send message. Client ${clientId} is not connected.`);
        }
    }

    // Broadcast a message to all connected clients
    broadcast(message) {
        this.clients.forEach((client, clientId) => {
            client.write(`data: ${JSON.stringify(message)}\n\n`);
        });
    }

    // Get the total number of connected clients (optional utility)
    getClientCount() {
        return this.clients.size;
    }
}

module.exports = new SSEManager();
