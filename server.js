const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'availability.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Initialize data file if it doesn't exist
const initializeData = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      developers: [
        {
          id: 'daniel',
          name: 'Daniel',
          availability: [
            {
              dayOfWeek: 1, // Monday
              slots: [
                { start: '10:30', end: '12:30' },
                { start: '14:00', end: '18:30' }
              ]
            },
            {
              dayOfWeek: 2, // Tuesday
              slots: [
                { start: '10:30', end: '12:30' },
                { start: '14:00', end: '18:30' }
              ]
            },
            {
              dayOfWeek: 3, // Wednesday
              slots: [
                { start: '10:30', end: '12:30' },
                { start: '14:00', end: '18:30' }
              ]
            },
            {
              dayOfWeek: 4, // Thursday
              slots: [
                { start: '10:30', end: '12:30' },
                { start: '14:00', end: '18:30' }
              ]
            },
            {
              dayOfWeek: 5, // Friday
              slots: [
                { start: '10:30', end: '12:30' },
                { start: '14:00', end: '18:30' }
              ]
            }
          ]
        }
      ],
      timezone: 'America/Santiago'
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

// GET endpoint - Fetch availability data
app.get('/api/availability', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading availability data:', error);
    res.status(500).json({ error: 'Failed to read availability data' });
  }
});

// POST endpoint - Update availability data
app.post('/api/availability', async (req, res) => {
  try {
    const newData = req.body;
    
    // Basic validation
    if (!newData.developers || !Array.isArray(newData.developers)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability data:', error);
    res.status(500).json({ error: 'Failed to update availability data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
  await ensureDataDir();
  await initializeData();
  
  app.listen(PORT, () => {
    console.log(`\nDev Availability Calendar Server`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Timezone: America/Santiago (Chile)`);
    console.log(`\nServer is running!\n`);
  });
};

startServer();