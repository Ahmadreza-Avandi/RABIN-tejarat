#!/bin/bash

echo "🔐 Testing Audio APIs with Authentication..."

# Step 1: Login and get token
echo "1. Logging in to get authentication token..."

# You need to replace these with actual credentials
read -p "Enter email: " EMAIL
read -s -p "Enter password: " PASSWORD
echo

# Login and extract token
LOGIN_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  -c cookies.txt)

echo "Login response: $LOGIN_RESPONSE"

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login successful!"
    
    # Extract token from response
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
    
    # Step 2: Test voice analysis API with token
    echo -e "\n2. Testing voice analysis API with authentication..."
    
    VOICE_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/process \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "گزارش احمد", "employeeName": "احمد"}')
    
    echo "Voice analysis response:"
    echo "$VOICE_RESPONSE" | jq . 2>/dev/null || echo "$VOICE_RESPONSE"
    
    # Step 3: Test TTS API with token
    echo -e "\n3. Testing TTS API with authentication..."
    
    TTS_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "سلام، این یک تست است"}')
    
    echo "TTS response:"
    echo "$TTS_RESPONSE" | jq . 2>/dev/null || echo "$TTS_RESPONSE"
    
    # Step 4: Test Speech Recognition API with token
    echo -e "\n4. Testing Speech Recognition API with authentication..."
    
    STT_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-speech-recognition \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"data": "fake_audio_data_for_test"}')
    
    echo "Speech Recognition response:"
    echo "$STT_RESPONSE" | jq . 2>/dev/null || echo "$STT_RESPONSE"
    
    # Clean up
    rm -f cookies.txt
    
    echo -e "\n✅ All tests completed!"
    
else
    echo "❌ Login failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi