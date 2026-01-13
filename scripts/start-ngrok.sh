#!/bin/bash

# Dev Availability Calendar - ngrok Startup Script
# This script starts ngrok to create a public URL for sharing the calendar

echo "Starting ngrok for Dev Availability Calendar..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null
then
    echo "Error: ngrok is not installed"
    echo ""
    echo "Please install ngrok:"
    echo "  - macOS: brew install ngrok"
    echo "  - Linux: sudo snap install ngrok"
    echo "  - Or download from: https://ngrok.com/download"
    echo ""
    exit 1
fi

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "Warning: Local server doesn't seem to be running on port 3000"
    echo ""
    echo "Please start the server first:"
    echo "  npm start"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting ngrok tunnel..."
echo ""
echo "Instructions:"
echo "  1. Copy the 'Forwarding' URL (https://...ngrok.io)"
echo "  2. Share it with your team"
echo "  3. Press Ctrl+C to stop ngrok"
echo ""
echo "Note: Free ngrok URLs expire when the tunnel is closed"
echo ""

# Start ngrok
ngrok http 3000