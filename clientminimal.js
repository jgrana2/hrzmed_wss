// test_ws.js
const WebSocket = require('ws');
const WSS_URL = 'wss://hrzmed.org/'; // Ensure this is the updated URL

const ws = new WebSocket(WSS_URL);

ws.on('open', () => {
  console.log('Connected to server:', WSS_URL);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed (code: ${code}, reason: ${reason?.toString() || 'N/A'})`);
});