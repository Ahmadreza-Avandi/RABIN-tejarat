#!/bin/bash

echo "🔍 Debug Audio System on VPS..."

# Test NextJS container
echo "📋 NextJS Container Status:"
docker exec crm-nextjs ps aux | grep node

# Test API endpoints
echo "🌐 Testing API endpoints..."

echo "1. Testing health endpoint:"
curl -s https://ahmadreza-avandi.ir/api/health || echo "Health API failed"

echo -e "\n2. Testing voice analysis process:"
curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/process \
  -H "Content-Type: application/json" \
  -d '{"text": "گزارش احمد", "employeeName": "احمد"}' | jq . || echo "Voice analysis API failed"

echo -e "\n3. Testing Sahab TTS:"
curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "سلام"}' || echo "TTS API failed"

echo -e "\n4. Testing Sahab Speech Recognition:"
curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-speech-recognition \
  -H "Content-Type: application/json" \
  -d '{"audioData": "test"}' || echo "Speech Recognition API failed"

# Check NextJS logs for errors
echo -e "\n📋 Recent NextJS logs:"
docker logs crm-nextjs --tail=50 | grep -E "(error|Error|ERROR|warn|Warn|WARN)"

# Check environment variables
echo -e "\n🔧 Environment check:"
docker exec crm-nextjs env | grep -E "(NODE_ENV|AUDIO|VPS|SAHAB)"

echo -e "\n✅ Debug completed!"