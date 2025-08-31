#!/bin/bash

echo "🔍 شروع دیباگ کامل سیستم..."

# بررسی وضعیت شبکه
echo "📡 تست اتصال شبکه..."
curl -I https://google.com
echo ""

# بررسی وضعیت Docker
echo "🐳 بررسی وضعیت Docker..."
docker ps
echo ""

# بررسی لاگ‌های NextJS
echo "📋 لاگ‌های NextJS..."
docker logs crm-nextjs --tail 50
echo ""

# تست API های اصلی
echo "🔌 تست API های سیستم..."
TOKEN=$(cat auth.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "🎯 تست API اصلی..."
curl -s -X GET "https://ahmadreza-avandi.ir/api/health" -H "Authorization: Bearer $TOKEN"
echo ""

echo "🎤 تست API صوتی..."
curl -s -X POST "https://ahmadreza-avandi.ir/api/v1/voice/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"test": true, "vps_mode": true}'
echo ""

# بررسی پورت‌های باز
echo "🔓 بررسی پورت‌های باز..."
netstat -tulpn | grep LISTEN
echo ""

# بررسی وضعیت SSL
echo "🔒 بررسی وضعیت SSL..."
curl -vI https://ahmadreza-avandi.ir
echo ""

# بررسی فضای دیسک
echo "💾 بررسی فضای دیسک..."
df -h
echo ""

# بررسی مصرف منابع
echo "📊 بررسی مصرف منابع..."
docker stats --no-stream
echo ""

echo "✅ دیباگ کامل به پایان رسید."
