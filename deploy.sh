#!/bin/bash

echo "🚀 Starting CRM System Deployment..."

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker image prune -f
docker rmi $(docker images -q --filter "dangling=true") 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 10
curl -f http://localhost/api/health || echo "❌ Health check failed"

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: http://localhost"
echo "🗄️  PhpMyAdmin available at: http://localhost/phpmyadmin"

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20