# نصب سریع سیستم CRM

## دستورات سریع (5 دقیقه)

```bash
# 1. کلون پروژه
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat

# 2. نصب dependencies
npm install

# 3. راه‌اندازی دیتابیس
chmod +x start-mysql.sh
./start-mysql.sh

# 4. تست اتصال
node test-db-connection.js

# 5. اجرای پروژه
npm run dev
```

## دسترسی‌ها
- **وب‌سایت**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080 (root/1234)

## پیش‌نیازها
- Node.js 18+
- Docker & Docker Compose
- Git

## مشکل داری؟
راهنمای کامل رو ببین: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---
✅ **تست شده و کار می‌کنه!**