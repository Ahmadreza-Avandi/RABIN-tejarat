#!/bin/bash

echo "🚀 شروع دیپلوی سیستم با پشتیبانی صوتی..."

# نصب سیستم صوتی
./setup-audio.sh

# ساخت image با پشتیبانی صوتی
echo "🏗️ ساخت Docker Image..."
docker build -t crm-audio -f Dockerfile.audio .

# تست سیستم صوتی
echo "🎵 تست سیستم صوتی..."
./test-audio-vps.sh

# اجرای کانتینر
echo "🐳 اجرای کانتینر..."
docker run -d \
  --name crm-system \
  -p 3000:3000 \
  --device /dev/snd \
  -v /tmp/pulse:/tmp/pulse \
  crm-audio

echo "✨ دیپلوی کامل شد! سیستم در پورت 3000 در دسترس است."
echo "📝 لاگ‌های سیستم را بررسی کنید:"
echo "docker logs crm-system"
