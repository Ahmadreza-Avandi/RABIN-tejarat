#!/bin/bash

echo "🚀 Complete Audio System Test for VPS..."

# Admin credentials
EMAIL="Robintejarat@gmail.com"
PASSWORD="admin123"

echo "🔐 Step 1: Authentication Test..."

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  -c cookies.txt)

echo "Login response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Authentication successful!"
    
    # Extract token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token extracted: ${TOKEN:0:20}..."
    
    echo -e "\n🎤 Step 2: Voice Analysis API Test..."
    echo "Testing: گزارش احمد"
    
    VOICE_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/process \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "گزارش احمد", "employeeName": "احمد"}')
    
    echo "Voice Analysis Response:"
    echo "$VOICE_RESPONSE" | jq . 2>/dev/null || echo "$VOICE_RESPONSE"
    
    if echo "$VOICE_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Voice Analysis API working!"
    else
        echo "❌ Voice Analysis API failed!"
    fi
    
    echo -e "\n🔊 Step 3: Text-to-Speech (TTS) API Test..."
    echo "Testing: سلام، سیستم صوتی کار می‌کند"
    
    TTS_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-tts \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"text": "سلام، سیستم صوتی کار می‌کند"}')
    
    echo "TTS Response:"
    echo "$TTS_RESPONSE" | jq . 2>/dev/null || echo "$TTS_RESPONSE"
    
    if echo "$TTS_RESPONSE" | grep -q -E '("success":true|"audioUrl"|"data")'; then
        echo "✅ TTS API working!"
    else
        echo "❌ TTS API failed!"
    fi
    
    echo -e "\n🎙️ Step 4: Speech-to-Text (STT) API Test..."
    echo "Testing with sample audio data..."
    
    STT_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sahab-speech-recognition \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"data": "UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=="}')
    
    echo "STT Response:"
    echo "$STT_RESPONSE" | jq . 2>/dev/null || echo "$STT_RESPONSE"
    
    if echo "$STT_RESPONSE" | grep -q -E '("success":true|"transcript"|"text")'; then
        echo "✅ STT API working!"
    else
        echo "❌ STT API failed!"
    fi
    
    echo -e "\n📊 Step 5: Sales Analysis API Test..."
    
    SALES_RESPONSE=$(curl -s -X POST https://ahmadreza-avandi.ir/api/voice-analysis/sales-analysis \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -b cookies.txt \
      -d '{"startDate": "2025-08-01", "endDate": "2025-08-29", "period": "1month"}')
    
    echo "Sales Analysis Response:"
    echo "$SALES_RESPONSE" | jq . 2>/dev/null || echo "$SALES_RESPONSE"
    
    if echo "$SALES_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Sales Analysis API working!"
    else
        echo "❌ Sales Analysis API failed!"
    fi
    
    echo -e "\n🔍 Step 6: System Health Check..."
    
    # Check NextJS container logs for errors
    echo "Checking NextJS container for errors..."
    ERROR_COUNT=$(docker logs crm-nextjs --tail=100 2>&1 | grep -i -E "(error|exception|failed)" | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo "✅ No errors found in NextJS logs"
    else
        echo "⚠️ Found $ERROR_COUNT potential errors in logs"
        echo "Recent errors:"
        docker logs crm-nextjs --tail=50 2>&1 | grep -i -E "(error|exception|failed)" | tail -5
    fi
    
    # Check container health
    echo -e "\nContainer Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep crm-
    
    # Clean up
    rm -f cookies.txt
    
    echo -e "\n🎉 Complete Audio System Test Finished!"
    echo "📋 Summary:"
    echo "   🔐 Authentication: ✅"
    echo "   🎤 Voice Analysis: $(echo "$VOICE_RESPONSE" | grep -q '"success":true' && echo "✅" || echo "❌")"
    echo "   🔊 Text-to-Speech: $(echo "$TTS_RESPONSE" | grep -q -E '("success":true|"audioUrl"|"data")' && echo "✅" || echo "❌")"
    echo "   🎙️ Speech-to-Text: $(echo "$STT_RESPONSE" | grep -q -E '("success":true|"transcript"|"text")' && echo "✅" || echo "❌")"
    echo "   📊 Sales Analysis: $(echo "$SALES_RESPONSE" | grep -q '"success":true' && echo "✅" || echo "❌")"
    
else
    echo "❌ Authentication failed!"
    echo "Response: $LOGIN_RESPONSE"
    
    echo -e "\n🔍 Debugging authentication issue..."
    
    # Check if user exists in database
    echo "Checking if user exists in database..."
    docker exec crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SELECT email, role, status FROM users WHERE email = '$EMAIL';" 2>/dev/null || echo "Could not query database"
    
    # Check NextJS logs for auth errors
    echo -e "\nChecking NextJS logs for authentication errors..."
    docker logs crm-nextjs --tail=20 2>&1 | grep -i -E "(auth|login|token)"
    
    exit 1
fi