#!/bin/bash

echo "🚀 Quick Audio API Test with Default Admin..."

# Default admin credentials
EMAIL="Robintejarat@gmail.com"
PASSWORD="admin123"

echo "🔐 Logging in with admin credentials..."

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  -c cookies.txt)

echo "Login response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login successful!"
    
    # Extract token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    echo -e "\n🎤 Testing Voice Analysis API..."
    curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/process \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "گزارش احمد", "employeeName": "احمد"}' | jq . 2>/dev/null || echo "Failed to parse JSON"
    
    echo -e "\n🔊 Testing TTS API..."
    curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "سلام"}' | jq . 2>/dev/null || echo "Failed to parse JSON"
    
    echo -e "\n🎙️ Testing Speech Recognition API..."
    curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-speech-recognition \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"data": "test_audio"}' | jq . 2>/dev/null || echo "Failed to parse JSON"
    
    # Clean up
    rm -f cookies.txt
    
else
    echo "❌ Login failed with admin credentials!"
    echo "You might need to:"
    echo "1. Check if admin user exists in database"
    echo "2. Use correct email/password"
    echo "3. Create admin user first"
    
    echo -e "\n🔍 Let's check what users exist in database..."
    docker exec crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SELECT email, role, status FROM users LIMIT 5;" 2>/dev/null || echo "Could not query database"
fi