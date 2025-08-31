#!/bin/bash

echo "🔍 Testing different Sahab API endpoints..."

# List of possible Sahab API endpoints to test
ENDPOINTS=(
    "https://api.sahab.ir"
    "https://partai.gw.isahab.ir"
    "https://gateway.sahab.ir"
    "https://tts.sahab.ir"
    "https://stt.sahab.ir"
    "https://speech.sahab.ir"
    "https://voice.sahab.ir"
    "https://api.isahab.ir"
    "https://gw.sahab.ir"
    "https://partai.sahab.ir"
)

echo "Testing basic connectivity to different endpoints..."

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing $endpoint: "
    if curl -s --connect-timeout 5 --max-time 10 "$endpoint" > /dev/null 2>&1; then
        echo "✅ Reachable"
        
        # Test specific TTS endpoint
        echo -n "  - TTS endpoint: "
        if curl -s --connect-timeout 5 --max-time 10 "$endpoint/tts" > /dev/null 2>&1; then
            echo "✅"
        elif curl -s --connect-timeout 5 --max-time 10 "$endpoint/TextToSpeech" > /dev/null 2>&1; then
            echo "✅ (TextToSpeech)"
        else
            echo "❌"
        fi
        
        # Test specific STT endpoint
        echo -n "  - STT endpoint: "
        if curl -s --connect-timeout 5 --max-time 10 "$endpoint/stt" > /dev/null 2>&1; then
            echo "✅"
        elif curl -s --connect-timeout 5 --max-time 10 "$endpoint/speechRecognition" > /dev/null 2>&1; then
            echo "✅ (speechRecognition)"
        else
            echo "❌"
        fi
        
    else
        echo "❌ Unreachable"
    fi
done

echo ""
echo "🔍 Testing from inside Docker container..."

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Docker test $endpoint: "
    if docker exec crm-nextjs curl -s --connect-timeout 5 --max-time 10 "$endpoint" > /dev/null 2>&1; then
        echo "✅ Reachable from container"
    else
        echo "❌ Unreachable from container"
    fi
done

echo ""
echo "🔍 DNS Resolution test..."
DOMAINS=(
    "api.sahab.ir"
    "partai.gw.isahab.ir"
    "gateway.sahab.ir"
    "sahab.ir"
    "isahab.ir"
)

for domain in "${DOMAINS[@]}"; do
    echo -n "DNS $domain: "
    if nslookup "$domain" > /dev/null 2>&1; then
        echo "✅ Resolved"
        # Show IP
        IP=$(nslookup "$domain" | grep -A1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null)
        if [ ! -z "$IP" ]; then
            echo "    IP: $IP"
        fi
    else
        echo "❌ Not resolved"
    fi
done

echo ""
echo "✅ Endpoint testing completed!"