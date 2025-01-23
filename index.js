const WebSocket = require('ws');
const mongoose = require('mongoose');

// Retrieve connection string from environment (docker-compose environment vars)
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/hrzsignaldb';

mongoose.connect(mongoUri, {
  // recommended options
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB at:', mongoUri))
  .catch(err => console.error('MongoDB connection error:', err));

// Simple WebSocket server
const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log('WebSocket server is running on port 3000');
});

wss.on('connection', (ws) => {
  console.log('New client connected!');
  
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    ws.send('Hello from Node.js WebSocket + MongoDB server!');
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});