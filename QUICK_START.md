# راه‌اندازی سریع سیستم بک‌آپ

## مراحل راه‌اندازی (5 دقیقه)

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. تنظیم متغیرهای محیطی
فایل `.env` را ویرایش کنید:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. راه‌اندازی دیتابیس
```bash
npm run setup-backup
```

### 4. تست سیستم
```bash
npm run quick-backup
```

## دستورات مفید

```bash
# راه‌اندازی کامل سیستم بک‌آپ
npm run setup-backup

# تست کامل سیستم
npm run test-backup-complete

# تست سریع بک‌آپ و ایمیل
npm run quick-backup

# تست تنظیمات
node test-settings.js
```

## تنظیمات پیش‌فرض

- **ایمیل گیرنده**: `only.link086@gmail.com`
- **زمان بک‌آپ**: `02:00` (2 صبح)
- **نوع بک‌آپ**: روزانه
- **مدت نگهداری**: 30 روز
- **فشرده‌سازی**: فعال

## تغییر تنظیمات

### از طریق API:
```javascript
// تغییر ایمیل گیرنده
await fetch('/api/settings/backup/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        enabled: true,
        schedule: 'daily',
        time: '02:00',
        emailRecipients: ['your-email@example.com'],
        retentionDays: 30,
        compression: true
    })
});
```

### از طریق پنل مدیریت:
1. برو به `/dashboard/settings`
2. تب "بک‌آپ" را انتخاب کن
3. تنظیمات را تغییر بده
4. "ذخیره" را بزن

## بررسی وضعیت

```bash
# مشاهده فایل‌های بک‌آپ
ls -la backups/

# مشاهده لاگ‌های سیستم
mysql -u root -p1234 crm_system -e "SELECT * FROM system_logs WHERE log_type LIKE '%backup%' ORDER BY created_at DESC LIMIT 5;"

# مشاهده تاریخچه بک‌آپ
mysql -u root -p1234 crm_system -e "SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 5;"
```

## مشکلات رایج

### mysqldump موجود نیست
```bash
sudo apt-get install mysql-client
```

### خطای ایمیل
- App Password برای Gmail تنظیم کن
- Two-Factor Authentication فعال کن

### مشکل دسترسی
```bash
chmod 755 backups/
```

## پشتیبانی

اگر مشکلی داشتی:
1. `npm run test-backup-complete` رو اجرا کن
2. لاگ‌ها رو بررسی کن
3. تنظیمات رو چک کن