# راهنمای سیستم بک‌آپ و تنظیمات

این راهنما نحوه استفاده از سیستم بک‌آپ خودکار و تنظیمات پروژه CRM را توضیح می‌دهد.

## ویژگی‌های سیستم

### 🔄 بک‌آپ خودکار
- بک‌آپ روزانه، هفتگی یا ماهانه
- فشرده‌سازی فایل‌های بک‌آپ (gzip)
- ارسال خودکار به ایمیل
- نگهداری فایل‌ها برای مدت مشخص
- حذف خودکار فایل‌های قدیمی

### 📧 سیستم ایمیل
- پشتیبانی از Gmail SMTP
- ارسال اعلان‌های بک‌آپ
- قالب‌های زیبا و فارسی
- ضمیمه کردن فایل بک‌آپ

### ⚙️ مدیریت تنظیمات
- تنظیمات مرکزی در دیتابیس
- رابط کاربری برای مدیریت
- لاگ تمام تغییرات
- اعتبارسنجی تنظیمات

## راه‌اندازی اولیه

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. راه‌اندازی دیتابیس
```bash
node scripts/setup-backup-system.js
```

### 3. تنظیم متغیرهای محیطی
فایل `.env` را ویرایش کنید:
```env
# Database
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. تست سیستم
```bash
node test-backup-complete.js
```

## استفاده از سیستم

### تنظیمات بک‌آپ

#### از طریق API:
```javascript
// دریافت تنظیمات فعلی
const response = await fetch('/api/settings/backup/configure');
const { config } = await response.json();

// ذخیره تنظیمات جدید
const newConfig = {
    enabled: true,
    schedule: 'daily', // daily, weekly, monthly
    time: '02:00',
    emailRecipients: ['admin@example.com'],
    retentionDays: 30,
    compression: true
};

await fetch('/api/settings/backup/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newConfig)
});
```

#### از طریق کد:
```javascript
import { settingsService } from '@/lib/settings-service';

// دریافت تنظیمات
const config = await settingsService.getBackupConfig();

// ذخیره تنظیمات
await settingsService.setBackupConfig({
    enabled: true,
    schedule: 'daily',
    time: '02:00',
    emailRecipients: ['admin@example.com'],
    retentionDays: 30,
    compression: true
});
```

### ایجاد بک‌آپ دستی

#### از طریق API:
```javascript
const response = await fetch('/api/settings/backup/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        emailRecipient: 'admin@example.com',
        includeEmail: true
    })
});

const result = await response.json();
console.log('Backup created:', result.backup);
```

#### از طریق کد:
```javascript
import { backupService } from '@/lib/backup';
import { emailService } from '@/lib/email-service';

// ایجاد بک‌آپ
const result = await backupService.createBackup({
    compress: true,
    includeData: true,
    excludeTables: ['system_logs']
});

// ارسال ایمیل
if (result.success) {
    await emailService.sendBackupEmail(result, 'admin@example.com');
}
```

### تنظیمات ایمیل

```javascript
import { settingsService } from '@/lib/settings-service';

// تنظیم ایمیل
await settingsService.setEmailConfig({
    enabled: true,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: true,
    smtp_user: 'your-email@gmail.com',
    smtp_password: 'your-app-password'
});
```

## API Endpoints

### بک‌آپ
- `GET /api/settings/backup/configure` - دریافت تنظیمات بک‌آپ
- `POST /api/settings/backup/configure` - ذخیره تنظیمات بک‌آپ
- `POST /api/settings/backup/manual` - ایجاد بک‌آپ دستی
- `GET /api/settings/backup/history` - تاریخچه بک‌آپ‌ها
- `GET /api/settings/backup/download/[id]` - دانلود فایل بک‌آپ

### ایمیل
- `GET /api/settings/email/configure` - دریافت تنظیمات ایمیل
- `POST /api/settings/email/configure` - ذخیره تنظیمات ایمیل
- `POST /api/settings/email/test` - تست ارسال ایمیل

### وضعیت سیستم
- `GET /api/settings/status` - وضعیت کلی سیستم

## ساختار فایل‌ها

```
lib/
├── backup.ts              # سرویس بک‌آپ
├── backup-scheduler.ts    # زمان‌بندی بک‌آپ
├── email-service.ts       # سرویس ایمیل
└── settings-service.ts    # مدیریت تنظیمات

app/api/settings/
├── backup/
│   ├── configure/         # تنظیمات بک‌آپ
│   ├── manual/            # بک‌آپ دستی
│   ├── history/           # تاریخچه
│   └── download/[id]/     # دانلود فایل
└── email/
    ├── configure/         # تنظیمات ایمیل
    └── test/              # تست ایمیل

scripts/
├── setup-backup-system.js # راه‌اندازی اولیه
└── create-settings-tables.sql # جداول دیتابیس

backups/                   # پوشه فایل‌های بک‌آپ
```

## نکات مهم

### امنیت
- فایل‌های بک‌آپ حاوی اطلاعات حساس هستند
- رمزهای عبور ایمیل را در متغیرهای محیطی ذخیره کنید
- دسترسی به فایل‌های بک‌آپ را محدود کنید

### عملکرد
- فایل‌های بک‌آپ به صورت فشرده ذخیره می‌شوند
- جداول لاگ از بک‌آپ حذف می‌شوند تا حجم کم شود
- فایل‌های قدیمی به صورت خودکار حذف می‌شوند

### نظارت
- تمام فعالیت‌ها در جدول `system_logs` ثبت می‌شوند
- تاریخچه بک‌آپ‌ها در جدول `backup_history` نگهداری می‌شود
- اعلان‌های ایمیل برای موفقیت و خطا ارسال می‌شوند

## عیب‌یابی

### مشکلات رایج

#### mysqldump موجود نیست
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# CentOS/RHEL
sudo yum install mysql

# macOS
brew install mysql-client
```

#### خطای ایمیل
- بررسی کنید که App Password برای Gmail تنظیم شده باشد
- Two-Factor Authentication باید فعال باشد
- تنظیمات SMTP را بررسی کنید

#### مشکل دسترسی فایل
- مجوزهای پوشه `backups` را بررسی کنید
- فضای دیسک کافی داشته باشید

### لاگ‌ها
```sql
-- مشاهده لاگ‌های سیستم
SELECT * FROM system_logs 
WHERE log_type LIKE '%backup%' 
ORDER BY created_at DESC 
LIMIT 10;

-- مشاهده تاریخچه بک‌آپ
SELECT * FROM backup_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## پشتیبانی

برای مشکلات و سوالات:
1. لاگ‌های سیستم را بررسی کنید
2. فایل `test-backup-complete.js` را اجرا کنید
3. تنظیمات ایمیل و دیتابیس را بررسی کنید