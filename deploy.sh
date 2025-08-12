#!/bin/bash

echo "🚀 Deploying CRM System with Docker..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old images
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:3000/api/health || echo "⚠️  Health check failed"

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at:"
echo "- https://ahmadreza-avandi.ir"
echo "- https://www.ahmadreza-avandi.ir"
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50