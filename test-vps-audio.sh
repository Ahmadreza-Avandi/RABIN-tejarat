#!/bin/bash

# Test VPS Audio Configuration
echo "🎤 Testing VPS Audio Configuration..."

# Check if Docker containers are running
if ! docker ps | grep -q crm-nextjs; then
    echo "❌ CRM NextJS container is not running!"
    exit 1
fi

# Test audio endpoints
echo "🔍 Testing audio endpoints..."
curl -s -o /dev/null -w "%{http_code}" https://ahmadreza-avandi.ir/api/audio/test
if [ $? -eq 0 ]; then
    echo "✅ Audio API endpoint is accessible"
else
    echo "❌ Audio API endpoint is not accessible"
fi

# Test WebSocket connection
echo "🔌 Testing WebSocket connection..."
wscat -c wss://ahmadreza-avandi.ir/audio-ws
if [ $? -eq 0 ]; then
    echo "✅ WebSocket connection successful"
else
    echo "❌ WebSocket connection failed"
fi

# Check audio directories
echo "📁 Checking audio directories..."
if [ -d "/app/audio-temp" ]; then
    echo "✅ Audio temp directory exists"
else
    echo "❌ Audio temp directory is missing"
fi

# Test audio processing
echo "🔊 Testing audio processing..."
curl -X POST "https://api.ahmadreza-avandi.ir/text-to-speech" \
     -H "Content-Type: application/json" \
     -d '{"text":"تست سیستم صوتی","speaker":"3","filePath":"true","base64":"0","checksum":"1"}'

echo "✨ Audio test complete!"
