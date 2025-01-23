// client.js
const WebSocket = require('ws');

// WSS endpoint
const WSS_URL = 'wss://hrzmed.org';

// Create the WebSocket client
const ws = new WebSocket(WSS_URL);

// When the connection is open, send a message to the server
ws.on('open', () => {
  console.log('Connected to server:', WSS_URL);
  ws.send('Hello from Node.js WSS client!');
});

// Log any messages from the server
ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection close
ws.on('close', (code, reason) => {
  console.log(`Connection closed (code: ${code}, reason: ${reason?.toString() || 'N/A'})`);
});