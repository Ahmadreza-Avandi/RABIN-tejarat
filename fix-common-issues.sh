#!/bin/bash

echo "🔧 Fixing Common VPS Audio Issues..."

echo "1. 🔄 Restarting NextJS container with proper environment..."
docker-compose restart nextjs

echo "2. ⏳ Waiting for NextJS to be ready..."
sleep 15

echo "3. 🔍 Checking container health..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep crm-

echo "4. 🌐 Testing basic connectivity..."
curl -s https://ahmadreza-avandi.ir/api/health || echo "Health endpoint not responding"

echo "5. 📋 Checking recent NextJS logs..."
docker logs crm-nextjs --tail=10

echo "6. 🔧 Setting proper environment variables..."
docker exec crm-nextjs sh -c 'export NODE_ENV=production && export VPS_MODE=true && export AUDIO_ENABLED=false'

echo "7. 🧪 Quick API test..."
curl -s -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "Robintejarat@gmail.com", "password": "admin123"}' | grep -o '"success":[^,]*'

echo -e "\n✅ Common fixes applied!"
echo "🧪 Run ./complete-audio-test.sh to test the system"