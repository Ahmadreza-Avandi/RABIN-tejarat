#!/bin/bash

echo "📤 آماده‌سازی برای پوش به سرور..."

# اضافه کردن فایل‌های جدید
git add .

# کامیت با پیام
echo "💬 وارد کردن پیام کامیت:"
read -p "پیام کامیت (یا اینتر برای پیام پیش‌فرض): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="🚀 بهینه‌سازی Docker و اسکریپت‌های deploy - آماده برای سرور"
fi

git commit -m "$COMMIT_MSG"

# پوش به ریپازیتوری
echo "📤 پوش به GitHub..."
git push origin main

echo ""
echo "✅ پوش کامل شد!"
echo ""
echo "🖥️  دستورات برای اجرا روی سرور:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  اتصال به سرور:"
echo "   ssh root@181.41.194.136"
echo ""
echo "2️⃣  رفتن به پوشه پروژه:"
echo "   cd RABIN-tejarat"
echo ""
echo "3️⃣  دریافت آخرین تغییرات:"
echo "   git pull origin main"
echo ""
echo "4️⃣  اجرای اسکریپت deploy:"
echo "   ./deploy-server.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 نکات مهم:"
echo "   • قبل از اجرا فایل .env را ویرایش کنید"
echo "   • رمزهای قوی برای دیتابیس تنظیم کنید"
echo "   • NEXTAUTH_URL=https://ahmadreza-avandi.ir"
echo "   • اگر مشکلی بود لاگ‌ها را بررسی کنید"