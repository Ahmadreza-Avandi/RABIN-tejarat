#!/bin/bash

echo "🔧 Setting up swap for better build performance..."

# Check if swap already exists
if [ $(swapon --show | wc -l) -gt 0 ]; then
    echo "✅ Swap already exists"
    swapon --show
    exit 0
fi

# Create 2GB swap file
echo "📁 Creating 2GB swap file..."
sudo fallocate -l 2G /swapfile

# Set correct permissions
echo "🔒 Setting permissions..."
sudo chmod 600 /swapfile

# Make swap
echo "⚙️  Making swap..."
sudo mkswap /swapfile

# Enable swap
echo "🔄 Enabling swap..."
sudo swapon /swapfile

# Make it permanent
echo "💾 Making swap permanent..."
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness for build performance
echo "⚡ Optimizing swappiness..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

echo "✅ Swap setup completed!"
echo "📊 Current memory status:"
free -h