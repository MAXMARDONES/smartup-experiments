# Dev Availability Calendar

An interactive web-based calendar for tracking developer availability within the SmartUp team. This tool helps team members visualize and manage their available time slots throughout the week.

## Features

- Interactive Calendar Interface: Visual weekly calendar with clickable time slots
- Multiple Developers: Support for tracking multiple team members
- Timezone Aware: All times displayed in Chile Time (CLT - America/Santiago)
- Persistent Storage: Changes are saved to a JSON file
- Real-time Updates: Changes reflect immediately in the interface
- Team Sharing: Use ngrok to share your calendar with the team

## Pre-configured Availability

The calendar comes pre-populated with Daniel's availability:
- **Monday - Friday**:
  - Morning: 10:30 - 12:30
  - Afternoon: 14:00 - 18:30
- **Timezone**: America/Santiago (Chile Time)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MAXMARDONES/smartup-experiments.git
cd smartup-experiments
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode

For auto-reload during development:
```bash
npm run dev
```

## Sharing with the Team (ngrok)

### Setup ngrok

1. Download ngrok from [ngrok.com](https://ngrok.com)
2. Sign up for a free account and get your auth token
3. Install ngrok:
```bash
# macOS
brew install ngrok

# Linux
sudo snap install ngrok

# Or download from ngrok.com
```

4. Authenticate ngrok:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Share Your Calendar

1. Start the local server:
```bash
npm start
```

2. In a new terminal, run the ngrok script:
```bash
npm run ngrok
```

Or manually:
```bash
ngrok http 3000
```

3. Share the public URL (e.g., `https://abc123.ngrok.io`) with your team

## Usage Guide

### Viewing Availability

1. Select a developer from the dropdown menu
2. View their weekly availability across all days
3. Green slots indicate available time periods
4. Gray slots indicate unavailable periods

### Updating Availability

1. Select your name from the developer dropdown
2. Click on time slots to toggle availability (green = available, gray = unavailable)
3. Click "Save Changes" to persist your updates
4. Changes are saved to `data/availability.json`

### Adding New Developers

1. Click the "+ Add Developer" button
2. Enter the developer's name
3. Start marking their availability
4. Save changes

## Project Structure

```
dev-availability-calendar/
├── server.js              # Express backend server
├── package.json           # Node.js dependencies
├── data/
│   └── availability.json  # Availability data storage
├── public/
│   ├── index.html        # Main HTML page
│   ├── styles.css        # Styling
│   └── app.js            # Frontend JavaScript
├── scripts/
│   └── start-ngrok.sh    # ngrok startup script
└── README.md             # This file
```

## API Endpoints

### GET /api/availability
Fetch current availability data for all developers.

**Response:**
```json
{
  "developers": [
    {
      "id": "daniel",
      "name": "Daniel",
      "availability": [...]
    }
  ],
  "timezone": "America/Santiago"
}
```

### POST /api/availability
Update availability data.

**Request Body:**
```json
{
  "developers": [...],
  "timezone": "America/Santiago"
}
```

### GET /health
Health check endpoint.

## Configuration

### Port Configuration

The server runs on port 3000 by default. To change it:
```bash
PORT=8080 npm start
```

### Timezone

The default timezone is set to `America/Santiago` (Chile Time). This can be modified in `data/availability.json`:
```json
{
  "timezone": "America/Santiago"
}
```

## Data Format

Availability data is stored in JSON format:

```json
{
  "developers": [
    {
      "id": "developer-id",
      "name": "Developer Name",
      "availability": [
        {
          "dayOfWeek": 1,
          "slots": [
            {
              "start": "10:30",
              "end": "12:30"
            }
          ]
        }
      ]
    }
  ],
  "timezone": "America/Santiago"
}
```

**Day of Week:** 1 = Monday, 2 = Tuesday, ..., 7 = Sunday

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Ensure Node.js is installed: `node --version`
- Try reinstalling dependencies: `rm -rf node_modules && npm install`

### Changes not saving
- Check file permissions on `data/availability.json`
- Ensure the `data/` directory exists
- Check server logs for errors

### ngrok connection issues
- Verify ngrok is authenticated: `ngrok config check`
- Ensure local server is running before starting ngrok
- Check firewall settings

## Contributing

This is an experimental project for the SmartUp team. Feel free to:
- Add new features
- Improve the UI
- Fix bugs
- Enhance documentation

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, contact the SmartUp development team.

---

**Made with love by the SmartUp Team**