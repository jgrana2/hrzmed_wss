require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Hello World</h1></body></html>');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

// Retrieve connection string from environment (docker-compose environment vars)
const mongoUri = process.env.MONGO_URI || `mongodb://mongo:27017/${process.env.DBNAME}`;

let client;
let db;

// Connect to MongoDB before starting the WebSocket server
async function connectToDatabase() {
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(process.env.DBNAME);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

// Simple WebSocket server
const wss = new WebSocket.Server({ port: 3000 }, async () => {
  await connectToDatabase(); // Connect to the database before accepting connections
  console.log('WebSocket server is running on port 3000');
});

// MongoDB Connection Info
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASSWORD;
const dbName = process.env.DBNAME;
const mongoUrl = `mongodb://${mongoUser}:${mongoPass}@mongo:27017/${dbName}`;

console.log('Mongo User:', mongoUser);
console.log('Mongo Pass:', mongoPass);
console.log('DB Name:', dbName);
console.log('Mongo URL:', mongoUrl);

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    // console.log(`Received: ${message}`);
    try {
      const data = JSON.parse(message);

      // Check if the message type is "ecg_sample"
      if (data.type === "ecg_sample") {
        const collection = db.collection('received_data'); // Use the connected db

        await collection.insertOne({
          timestamp: new Date(),
          data,
        });

        console.log(`Saved: ${message}`);
      } else {
        // Print the message if it's not of type "ecg_sample"
        console.log(`Received: ${message}`);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  if (data.type === 'new_recording') {
    // Create a new recording entry
    const insertResponse = await db.collection('recordings').insertOne({
      recording_id: data.recording_id,
      patient_id: data.patient_id,
      device_id: data.device_id,
      start_time: new Date(data.start_time),
      end_time: new Date(data.start_time),
      segments: [],
      status: 'in_progress',
      created_at: new Date()
    });

    if (insertResponse.insertedCount === 1) {
      ws.send(JSON.stringify({ status: 'success', message: 'New recording created' }));
    } else {
      ws.send(JSON.stringify({ status: 'error', message: 'Failed to create recording' }));
    }
  } else {
    ws.send(JSON.stringify({ status: 'error', message: 'Unknown data type' }));
  }
});

ws.on('close', () => {
  console.log('Client disconnected');
});

// Start server on internal port (e.g., 3000)
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`HTTP server is listening on port ${PORT}`);
});