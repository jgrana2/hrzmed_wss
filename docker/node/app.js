// docker/node/app.js
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 4433 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        ws.send('Hello from the server!');
    });
});
