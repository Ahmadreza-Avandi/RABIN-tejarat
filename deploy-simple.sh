#!/bin/bash

echo "🚀 شروع دیپلوی با Dockerfile ساده..."

# پاک کردن کانتینرها و ایمیج‌های قبلی
echo "🧹 پاکسازی..."
docker rm -f crm-system || true
docker rmi -f crm-app || true

# ساخت ایمیج با Dockerfile ساده
echo "🏗️ ساخت Docker image..."
docker build -t crm-app -f Dockerfile.simple .

# اجرای کانتینر
echo "🐳 اجرای کانتینر..."
docker run -d \
  --name crm-system \
  -p 3000:3000 \
  --device /dev/snd \
  -v /tmp/pulse:/tmp/pulse \
  crm-app

echo "✨ سیستم در حال اجراست!"
echo "📝 برای مشاهده لاگ‌ها:"
echo "docker logs -f crm-system"
