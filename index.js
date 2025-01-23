const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log('WebSocket server is running on port 3000');
});

wss.on('connection', (ws) => {
  console.log('New client connected!');
  
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    ws.send('Hello from Node.js WebSocket server!');
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});