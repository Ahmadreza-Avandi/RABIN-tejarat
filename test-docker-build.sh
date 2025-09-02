#!/bin/bash

echo "🧪 تست Docker Build..."

# تست Dockerfile
echo "📦 تست Dockerfile..."
docker build -t crm-test . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Dockerfile build موفق بود"
    
    # پاکسازی
    docker rmi crm-test
    echo "🧹 تست image پاک شد"
else
    echo "❌ Dockerfile build ناموفق بود"
    exit 1
fi

# تست docker-compose
echo "📋 تست docker-compose syntax..."
docker-compose -f docker-compose.yml config > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ docker-compose.yml syntax درست است"
else
    echo "❌ docker-compose.yml syntax مشکل دارد"
    exit 1
fi

# تست memory-optimized compose
echo "📋 تست docker-compose memory-optimized syntax..."
docker-compose -f docker-compose.memory-optimized.yml config > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ docker-compose.memory-optimized.yml syntax درست است"
else
    echo "❌ docker-compose.memory-optimized.yml syntax مشکل دارد"
    exit 1
fi

echo "🎉 همه تست‌ها موفق بودند!"