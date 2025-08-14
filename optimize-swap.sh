#!/bin/bash

echo "🔧 بهینه‌سازی swap برای build..."

# تنظیم swappiness برای استفاده بیشتر از swap
echo "vm.swappiness=60" | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=60

# تنظیم vfs_cache_pressure برای آزاد کردن memory
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.vfs_cache_pressure=50

# نمایش وضعیت
echo "📊 وضعیت memory و swap:"
free -h

echo "✅ بهینه‌سازی انجام شد!"