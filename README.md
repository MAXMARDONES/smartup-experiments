# Dev Availability Calendar - SmartUp

A modern booking system for clients to schedule meetings with Daniel Sateler.

## Features

- **Single-User Booking System**: Clients can book available time slots with Daniel Sateler
- **Structured Time Slots**:
  - Morning: 10:30 - 12:30 (30-minute blocks)
  - Afternoon: 14:00 - 18:30 (1-hour blocks)
- **Real-time Availability**: See which slots are available or already booked
- **Easy Booking**: Click a slot, enter your name, and confirm
- **Cancel Bookings**: Click on a booked slot to cancel it
- **Mobile Responsive**: Works perfectly on all devices
- **SmartUp Branding**: Professional look with SmartUp colors and logo

## Security Features

- Input sanitization to prevent XSS attacks
- Name validation (2-100 characters)
- Rate limiting (100 requests per 15 minutes)
- Atomic file operations to prevent race conditions
- Safe character filtering for client names

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## API Endpoints

### GET /api/availability
Get all bookings and availability data.

**Response:**
```json
{
  "developer": "Daniel Sateler",
  "slots": [
    {
      "date": "2026-01-15",
      "time": "10:30",
      "booked": true,
      "clientName": "John Doe",
      "bookedAt": "2026-01-13T17:30:00.000Z"
    }
  ]
}
```

### POST /api/book
Book a time slot.

**Request:**
```json
{
  "date": "2026-01-15",
  "time": "14:00",
  "clientName": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time slot booked successfully",
  "slot": {
    "date": "2026-01-15",
    "time": "14:00",
    "clientName": "Jane Smith"
  }
}
```

### POST /api/cancel
Cancel a booking.

**Request:**
```json
{
  "date": "2026-01-15",
  "time": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "developer": "Daniel Sateler"
}
```

## Data Storage

Bookings are stored in `data/availability.json`. The file is created automatically on first use.

**Structure:**
```json
{
  "developer": "Daniel Sateler",
  "slots": []
}
```

## Available Time Slots

- **Morning Session**: 10:30, 11:00, 11:30, 12:00, 12:30 (30-minute blocks)
- **Afternoon Session**: 14:00, 15:00, 16:00, 17:00, 18:00 (1-hour blocks)

## Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS Variables
- **Data Storage**: JSON file (simple and portable)
- **Security**: express-rate-limit, input sanitization

## Configuration

- **Port**: Set via `PORT` environment variable (default: 3000)
- **Rate Limit**: 100 requests per 15 minutes per IP
- **Data File**: `data/availability.json`

## Development

The application uses atomic file operations to prevent race conditions when multiple clients try to book the same slot simultaneously. All inputs are sanitized and validated before processing.

## Future Enhancements

Possible improvements for future versions:
- Database integration (PostgreSQL/MongoDB)
- User authentication for Daniel
- Email notifications for new bookings
- Calendar integration (Google Calendar, Outlook)
- Booking reminders
- Time zone support for international clients
- Analytics dashboard

## License

MIT

## Author

SmartUp - 2026
