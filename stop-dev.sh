#!/bin/bash

echo "🛑 توقف محیط توسعه CRM..."

# توقف کانتینرها
docker-compose -f docker-compose.db-only.yml down

echo "✅ محیط توسعه متوقف شد."
echo ""
echo "💡 برای حذف کامل داده‌ها از دستور زیر استفاده کنید:"
echo "   docker-compose -f docker-compose.db-only.yml down -v"