#!/bin/bash

echo "🔍 Debugging Network Issues for Audio APIs..."

echo "1. 🌐 Testing external connectivity from NextJS container..."

# Test basic internet connectivity
echo "Testing Google DNS..."
docker exec crm-nextjs ping -c 3 8.8.8.8 || echo "❌ No internet connectivity"

echo -e "\nTesting HTTPS connectivity..."
docker exec crm-nextjs curl -s --connect-timeout 10 https://www.google.com > /dev/null && echo "✅ HTTPS works" || echo "❌ HTTPS blocked"

echo -e "\n2. 🔧 Testing Sahab API endpoints..."

# Test Sahab TTS endpoint
echo "Testing Sahab TTS endpoint..."
docker exec crm-nextjs curl -s --connect-timeout 10 -X POST https://api.sahab.ir/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}' || echo "❌ Cannot reach Sahab TTS API"

# Test Sahab STT endpoint  
echo -e "\nTesting Sahab STT endpoint..."
docker exec crm-nextjs curl -s --connect-timeout 10 -X POST https://api.sahab.ir/speech-to-text \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}' || echo "❌ Cannot reach Sahab STT API"

echo -e "\n3. 🔍 Checking environment variables..."
docker exec crm-nextjs env | grep -E "(SAHAB|API)" || echo "No Sahab API keys found"

echo -e "\n4. 📋 Checking NextJS logs for network errors..."
docker logs crm-nextjs --tail=50 | grep -i -E "(fetch|network|timeout|connection)" || echo "No network errors in logs"

echo -e "\n5. 🔧 Testing DNS resolution..."
docker exec crm-nextjs nslookup api.sahab.ir || echo "❌ Cannot resolve Sahab API domain"

echo -e "\n6. 🚪 Checking firewall rules..."
sudo iptables -L OUTPUT | grep -E "(DROP|REJECT)" || echo "No obvious firewall blocks"

echo -e "\n7. 🌐 Testing alternative TTS/STT services..."

# Test Google TTS (if available)
echo "Testing Google TTS..."
docker exec crm-nextjs curl -s --connect-timeout 5 "https://translate.google.com/translate_tts?ie=UTF-8&tl=fa&q=test" > /dev/null && echo "✅ Google TTS accessible" || echo "❌ Google TTS blocked"

echo -e "\n✅ Network debugging completed!"