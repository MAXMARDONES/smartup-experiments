const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'availability.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, '') // Allow alphanumeric, spaces, hyphens, and Spanish chars
    .trim()
    .slice(0, 100); // Max 100 characters
}

// Validate client name
function validateClientName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Client name is required' };
  }

  const sanitized = sanitizeInput(name);

  if (sanitized.length < 2) {
    return { valid: false, error: 'Client name must be at least 2 characters' };
  }

  if (sanitized.length > 100) {
    return { valid: false, error: 'Client name must be less than 100 characters' };
  }

  return { valid: true, sanitized };
}

// Validate time slot format
function validateTimeSlot(date, time) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^(10:30|14:00|15:00|16:00|17:00)$/;

  if (!datePattern.test(date)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  if (!timePattern.test(time)) {
    return { valid: false, error: 'Invalid time slot. Available slots: 10:30-12:30 (30min blocks) or 14:00-18:30 (1h blocks)' };
  }

  return { valid: true };
}

// Helper to read data with file locking simulation
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    // Return default structure if file doesn't exist
    return {
      developer: "Daniel Sateler",
      slots: []
    };
  }
}

// Helper to write data with atomic operation
async function writeData(data) {
  const tempFile = DATA_FILE + '.tmp';
  try {
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    console.error('Error writing data file:', error);
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

// API Endpoints

// GET /api/availability - Get all bookings
app.get('/api/availability', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// POST /api/book - Book a time slot
app.post('/api/book', async (req, res) => {
  try {
    const { date, time, clientName } = req.body;

    // Validate inputs
    const nameValidation = validateClientName(clientName);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    const timeValidation = validateTimeSlot(date, time);
    if (!timeValidation.valid) {
      return res.status(400).json({ error: timeValidation.error });
    }

    // Read current data
    const data = await readData();

    // Check if slot is already booked
    const existingSlot = data.slots.find(
      slot => slot.date === date && slot.time === time
    );

    if (existingSlot && existingSlot.booked) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    // Create or update slot
    if (existingSlot) {
      existingSlot.booked = true;
      existingSlot.clientName = nameValidation.sanitized;
      existingSlot.bookedAt = new Date().toISOString();
    } else {
      data.slots.push({
        date,
        time,
        booked: true,
        clientName: nameValidation.sanitized,
        bookedAt: new Date().toISOString()
      });
    }

    // Write data atomically
    await writeData(data);

    res.json({
      success: true,
      message: 'Time slot booked successfully',
      slot: {
        date,
        time,
        clientName: nameValidation.sanitized
      }
    });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ error: 'Failed to book time slot' });
  }
});

// POST /api/cancel - Cancel a booking
app.post('/api/cancel', async (req, res) => {
  try {
    const { date, time } = req.body;

    // Validate inputs
    const timeValidation = validateTimeSlot(date, time);
    if (!timeValidation.valid) {
      return res.status(400).json({ error: timeValidation.error });
    }

    // Read current data
    const data = await readData();

    // Find and update slot
    const slotIndex = data.slots.findIndex(
      slot => slot.date === date && slot.time === time
    );

    if (slotIndex === -1 || !data.slots[slotIndex].booked) {
      return res.status(404).json({ error: 'No booking found for this time slot' });
    }

    // Remove the slot
    data.slots.splice(slotIndex, 1);

    // Write data atomically
    await writeData(data);

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', developer: 'Daniel Sateler' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dev Availability Calendar running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
