#!/bin/bash

# Production Deployment Script
echo "🚀 Starting production deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file based on .env.example"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f /etc/letsencrypt/live/ahmadreza-avandi.ir/fullchain.pem ]; then
    echo "⚠️  Warning: SSL certificates not found!"
    echo "Make sure to setup SSL certificates before running this script"
    echo "You can use certbot to generate SSL certificates:"
    echo "sudo certbot --nginx -d ahmadreza-avandi.ir -d www.ahmadreza-avandi.ir"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional - uncomment if you want to force rebuild)
# echo "🗑️  Removing old images..."
# docker-compose down --rmi all

# Pull latest images and build
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 10
curl -f http://localhost:3000/api/health || echo "⚠️  Health check failed"

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at:"
echo "   - https://ahmadreza-avandi.ir"
echo "   - https://www.ahmadreza-avandi.ir"

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=50