// client.js
const WebSocket = require('ws');

// WSS endpoint (replace with your actual domain if different)
const WSS_URL = 'wss://hrzmed.org/'; // Ensure the path matches your Nginx config

// Unique identifiers for the recording and segments
const RECORDING_ID = 'rec12345';
const PATIENT_ID = 'patient67890';
const DEVICE_ID = 'deviceABCDE';

// Sample segments data (replace with actual data as needed)
const SEGMENTS = [
  { segment_id: 'seg1', data: 'Segment 1 data', timestamp: Date.now() },
  { segment_id: 'seg2', data: 'Segment 2 data', timestamp: Date.now() },
  { segment_id: 'seg3', data: 'Segment 3 data', timestamp: Date.now() },
];

// Create the WebSocket client
const ws = new WebSocket(WSS_URL);

// Handle connection open
ws.on('open', () => {
  console.log(`Connected to server: ${WSS_URL}`);

  // Step 1: Send 'new_recording' message
  const newRecordingMessage = {
    type: 'new_recording',
    recording_id: RECORDING_ID,
    patient_id: PATIENT_ID,
    device_id: DEVICE_ID,
    start_time: new Date().toISOString(),
  };

  ws.send(JSON.stringify(newRecordingMessage));
  console.log('Sent new_recording message:', newRecordingMessage);
});

// Handle incoming messages from the server
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message from server:', message);

    if (message.status === 'success' && message.message === 'New recording created') {
      // Step 2: Send 'segment' messages sequentially
      SEGMENTS.forEach((segment, index) => {
        setTimeout(() => {
          const segmentMessage = {
            type: 'segment',
            recording_id: RECORDING_ID,
            segment: {
              segment_id: segment.segment_id,
              data: segment.data,
              timestamp: segment.timestamp,
            },
          };

          ws.send(JSON.stringify(segmentMessage));
          console.log(`Sent segment ${index + 1}:`, segmentMessage);
        }, 1000 * (index + 1)); // Delay each segment by 1 second
      });

      // Step 3: After all segments are sent, send 'complete_recording' message
      setTimeout(() => {
        const completeRecordingMessage = {
          type: 'complete_recording',
          recording_id: RECORDING_ID,
        };

        ws.send(JSON.stringify(completeRecordingMessage));
        console.log('Sent complete_recording message:', completeRecordingMessage);
      }, 1000 * (SEGMENTS.length + 2)); // Additional delay to ensure all segments are processed
    }
  } catch (error) {
    console.error('Error parsing message from server:', error);
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection close
ws.on('close', (code, reason) => {
  console.log(`Connection closed (code: ${code}, reason: ${reason?.toString() || 'N/A'})`);
});