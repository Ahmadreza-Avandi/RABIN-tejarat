#!/bin/bash

echo "🔍 Detailed Audio API Debugging..."

# Admin credentials
EMAIL="Robintejarat@gmail.com"
PASSWORD="admin123"

echo "🔐 Getting authentication token..."
TOKEN=$(curl -s -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

echo -e "\n🔊 Testing TTS API with detailed logging..."

# Test TTS with verbose output
TTS_RESPONSE=$(curl -v -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "تست"}' 2>&1)

echo "Full TTS Response:"
echo "$TTS_RESPONSE"

echo -e "\n🎙️ Testing STT API with detailed logging..."

# Test STT with verbose output
STT_RESPONSE=$(curl -v -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-speech-recognition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data": "test"}' 2>&1)

echo "Full STT Response:"
echo "$STT_RESPONSE"

echo -e "\n📋 Checking NextJS container logs for API calls..."
docker logs crm-nextjs --tail=20 | grep -E "(TTS|STT|Sahab|Fetch Error|Fallback)"

echo -e "\n🌐 Testing network connectivity from container..."
echo "Testing external connectivity:"
docker exec crm-nextjs ping -c 2 8.8.8.8 || echo "❌ No internet"

echo -e "\nTesting HTTPS connectivity:"
docker exec crm-nextjs curl -s --connect-timeout 5 https://www.google.com > /dev/null && echo "✅ HTTPS works" || echo "❌ HTTPS blocked"

echo -e "\nTesting Sahab API endpoint:"
docker exec crm-nextjs curl -s --connect-timeout 5 https://partai.gw.isahab.ir > /dev/null && echo "✅ Sahab reachable" || echo "❌ Sahab unreachable"

echo -e "\n🔧 Environment variables in container:"
docker exec crm-nextjs env | grep -E "(NODE_ENV|VPS|AUDIO|SAHAB)"

echo -e "\n✅ Detailed debugging completed!"