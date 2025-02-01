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

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// MongoDB Connection Info
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASSWORD;
const dbName = process.env.DB_NAME || process.env.DBNAME; // Ensure correct variable
const mongoUrl = `mongodb://${mongoUser}:${mongoPass}@mongo:27017/${dbName}`;

console.log('Mongo User:', mongoUser);
console.log('Mongo Pass:', mongoPass);
console.log('DB Name:', dbName);
console.log('Mongo URL:', mongoUrl);

let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    })
    .catch(err => console.error('MongoDB connection error:', err.message));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

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
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ status: 'error', message: 'Invalid data format' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start server on internal port (e.g., 3000)
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`HTTP server is listening on port ${PORT}`);
});