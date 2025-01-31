const http = require('http'); // Changed from 'https' to 'http'
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

// Create HTTP server (no SSL)
const server = http.createServer();

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// MongoDB connection URI using the service name 'mongo'
// Update this if your MongoDB service has a different hostname in Docker Compose
const mongoUrl = 'mongodb://mongo:27017';
const dbName = 'ecg_db';
let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'new_recording') {
                // Create a new recording entry
                await db.collection('recordings').insertOne({
                    recording_id: data.recording_id,
                    patient_id: data.patient_id,
                    device_id: data.device_id,
                    start_time: new Date(data.start_time),
                    end_time: new Date(data.start_time),
                    segments: [],
                    status: 'in_progress',
                    created_at: new Date()
                });

                ws.send(JSON.stringify({ status: 'success', message: 'New recording created' }));
            } 
            else if (data.type === 'segment') {
                // Append new segment to the recording
                const existingRecording = await db.collection('recordings').findOne({ recording_id: data.recording_id });

                if (!existingRecording) {
                    ws.send(JSON.stringify({ status: 'error', message: 'Recording not found' }));
                    return;
                }

                await db.collection('recordings').updateOne(
                    { recording_id: data.recording_id },
                    { 
                        $push: { segments: data.segment }, // Append new segment
                        $set: { end_time: new Date(data.timestamp), updated_at: new Date() } // Update end time
                    }
                );

                ws.send(JSON.stringify({ status: 'success', message: 'Segment stored' }));
            } 
            else if (data.type === 'complete_recording') {
                // Mark recording as completed
                await db.collection('recordings').updateOne(
                    { recording_id: data.recording_id },
                    { $set: { status: 'completed', updated_at: new Date() } }
                );

                ws.send(JSON.stringify({ status: 'success', message: 'Recording marked as completed' }));
            } 
            else {
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
    console.log(`WebSocket server is listening on port ${PORT}`);
});