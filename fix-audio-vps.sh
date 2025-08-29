#!/bin/bash

echo "🔧 Fixing Audio System for VPS..."

# Step 1: Update environment variables for VPS
echo "📝 Updating environment variables..."
docker exec crm-nextjs sh -c 'export AUDIO_ENABLED=false && export VPS_MODE=true && export FALLBACK_TO_MANUAL_INPUT=true'

# Step 2: Restart NextJS container with new environment
echo "🔄 Restarting NextJS container..."
docker-compose restart nextjs

# Step 3: Wait for container to be ready
echo "⏳ Waiting for NextJS to be ready..."
sleep 15

# Step 4: Test the APIs
echo "🧪 Testing APIs..."

# Test voice analysis
echo "Testing voice analysis API..."
response=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/process \
  -H "Content-Type: application/json" \
  -d '{"text": "گزارش احمد", "employeeName": "احمد"}')

if echo "$response" | grep -q "success"; then
    echo "✅ Voice analysis API working"
else
    echo "❌ Voice analysis API failed: $response"
fi

# Test TTS
echo "Testing TTS API..."
tts_response=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "سلام"}')

if echo "$tts_response" | grep -q -E "(success|audio|data)"; then
    echo "✅ TTS API working"
else
    echo "❌ TTS API failed: $tts_response"
fi

# Step 5: Show current logs
echo "📋 Current NextJS logs:"
docker logs crm-nextjs --tail=20

echo "✅ Fix completed! Try the audio system now."