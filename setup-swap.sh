#!/bin/bash

# اسکریپت تنظیم swap برای سرور ضعیف
echo "تنظیم swap برای بهینه‌سازی سرور..."

# بررسی وجود swap
if swapon --show | grep -q "/swapfile"; then
    echo "Swap قبلاً تنظیم شده است"
    exit 0
fi

# ایجاد فایل swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# اضافه کردن به fstab برای دائمی شدن
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# تنظیم swappiness برای بهینه‌سازی
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

echo "✅ Swap با موفقیت تنظیم شد"
echo "📊 وضعیت فعلی:"
free -h