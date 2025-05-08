require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

// Retrieve connection string from environment (docker-compose environment vars)
const mongoUri = process.env.MONGO_URI || `mongodb://mongo:27017/${process.env.DBNAME}`;

let client;
let db;

// Connect to MongoDB before starting the server
async function connectToDatabase() {
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(process.env.DBNAME);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // exit if connection fails
  }
}

// Create the default HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <title>Welcome to HRZMed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              text-align: center;
              padding: 50px;
            }
            h1 {
              color: #333;
            }
            p {
              font-size: 18px;
              color: #666;
            }
            a {
              color: #007BFF;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <h1>Welcome to HRZMed</h1>
          <p>Your health is important to us.</p>
          <p><a href="/about">Learn more about our services</a></p>
        </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

const PORT = process.env.PORT || 3000;

// First, connect to the database, then start the server and attach the WebSocket server
connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`HTTP server is listening on port ${PORT}`);
  });

  // Attach WebSocket server to the existing HTTP server
  const wss = new WebSocket.Server({ server });
  console.log(`WebSocket server is attached to HTTP server on port ${PORT}`);

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
      try {
        const msgData = JSON.parse(message);
        
        // Try to parse nested message JSON string if it exists
        try {
          if (msgData.message) {
            const innerData = JSON.parse(msgData.message);
            
            // Handle register_patient message type
            if (innerData.type === 'register_patient' && innerData.patient) {
              const collection = db.collection('patients');
              await collection.insertOne({
                ...innerData.patient,
                timestamp: new Date(),
              });
              console.log(`Saved patient: ${innerData.patient.name}`);
              return;
            }
          }
        } catch (parseError) {
          // Continue with normal processing if inner parsing fails
        }
        
        // Handle other message types
        if (msgData.type === 'ecg_chunk') {
          const collection = db.collection('ecg_chunks');
          await collection.insertOne({
            timestamp: new Date(),
            data: msgData,
          });
          console.log(`Saved: ${message}`);
          // Broadcast the ECG chunk to all connected clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        } else {
          console.log(`Received: ${message}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}).catch(err => {
  console.error('Error connecting to database:', err);
});