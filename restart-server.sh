#!/bin/bash

echo "🔄 Restarting Backend Server..."

# Kill existing server
pkill -f "node.*server.js"
echo "✅ Stopped old server"

# Wait a moment
sleep 1

# Start new server
echo "🚀 Starting new server..."
node server.js
