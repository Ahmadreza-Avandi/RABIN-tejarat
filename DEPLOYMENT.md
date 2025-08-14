# 🚀 راهنمای Deploy پروژه CRM

## پیش‌نیازها:
- Docker & Docker Compose
- MySQL Database
- حداقل 1GB RAM
- حداقل 2GB فضای دیسک

## مراحل Deploy:

### 1. کلون پروژه:
```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. تنظیم Environment Variables:
```bash
cp .env.example .env
```

متغیرهای ضروری:
```env
DATABASE_HOST=your-mysql-host
DATABASE_USER=your-mysql-user
DATABASE_PASSWORD=your-mysql-password
DATABASE_NAME=cem_crm
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. اجرا با Docker Compose:
```bash
docker-compose up -d
```

### 4. بررسی وضعیت:
```bash
docker-compose ps
docker-compose logs cem-crm
```

## دسترسی:
- **وب‌سایت:** http://localhost:3000
- **API Health Check:** http://localhost:3000/api/settings/status

## مشخصات فنی:
- **Bundle Size:** 385 kB (بهینه شده)
- **Memory Usage:** 512MB-1GB
- **Build Time:** بهینه شده
- **Dependencies:** کاهش یافته

## مانیتورینگ:
```bash
# مشاهده logs
docker-compose logs -f cem-crm

# بررسی resource usage
docker stats

# restart سرویس
docker-compose restart cem-crm
```

## Troubleshooting:
1. **Memory Issues:** افزایش memory limit در docker-compose.yml
2. **Database Connection:** بررسی DATABASE_* variables
3. **Build Errors:** پاک کردن cache: `docker system prune -a`

## Production Tips:
- استفاده از reverse proxy (nginx)
- تنظیم SSL certificate
- backup منظم database
- مانیتورینگ logs و metrics