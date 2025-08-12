# 📧 راهنمای کامل سیستم بک‌آپ و ارسال ایمیل

## 🎯 معرفی

این سیستم امکان ایجاد بک‌آپ خودکار از دیتابیس و ارسال آن به ایمیل‌های مشخص شده را فراهم می‌کند.

## 🚀 نصب و راه‌اندازی

### 1. پیش‌نیازها

```bash
# نصب mysqldump (معمولاً با MySQL نصب می‌شود)
sudo apt-get install mysql-client

# بررسی نصب
mysqldump --version
```

### 2. تنظیمات محیط

فایل `.env` را به‌روزرسانی کنید:

```env
# تنظیمات دیتابیس
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system

# تنظیمات ایمیل
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# URL برنامه (برای لینک‌ها در ایمیل)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. تنظیمات Gmail

1. فعال‌سازی 2-Step Verification در Gmail
2. ایجاد App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - انتخاب "Mail" و "Other"
   - کپی کردن رمز عبور ایجاد شده در `EMAIL_PASSWORD`

## 📋 ساختار فایل‌ها

```
lib/
├── backup-email-service.ts    # سرویس اصلی بک‌آپ و ایمیل
├── backup.ts                  # سرویس بک‌آپ دیتابیس
├── email-service.ts           # سرویس ارسال ایمیل
└── settings-service.ts        # مدیریت تنظیمات

app/api/backup/
├── create/route.ts            # API ایجاد بک‌آپ
└── quick-send/route.ts        # API ارسال سریع

components/
└── backup-email-manager.tsx   # کامپوننت مدیریت UI

# فایل‌های تست
test-backup-email-complete.js
quick-test-backup-email.js
```

## 🔧 استفاده از سیستم

### 1. تست سریع سیستم

```bash
# تست کامل سیستم
node test-backup-email-complete.js

# تست سریع با ایمیل خاص
node quick-test-backup-email.js your-email@gmail.com
```

### 2. استفاده از API

#### ایجاد بک‌آپ کامل:

```javascript
const response = await fetch('/api/backup/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        compress: true,          // فشرده‌سازی فایل
        includeData: true,       // شامل داده‌ها
        sendEmail: true,         // ارسال ایمیل
        excludeTables: ['logs'], // جداول حذف شده
        customRecipients: ['email@example.com'] // گیرندگان خاص
    })
});
```

#### ارسال سریع:

```javascript
const response = await fetch('/api/backup/quick-send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'recipient@example.com'
    })
});
```

#### دریافت آمار:

```javascript
const response = await fetch('/api/backup/create?action=stats');
const stats = await response.json();
```

### 3. استفاده از کامپوننت React

```jsx
import BackupEmailManager from '@/components/backup-email-manager';

function SettingsPage() {
    return (
        <div>
            <h1>مدیریت بک‌آپ</h1>
            <BackupEmailManager />
        </div>
    );
}
```

### 4. استفاده برنامه‌نویسی

```typescript
import { backupEmailService } from '@/lib/backup-email-service';

// ایجاد بک‌آپ و ارسال ایمیل
const result = await backupEmailService.createBackupAndSendEmail({
    compress: true,
    sendEmail: true,
    customRecipients: ['admin@company.com']
});

// ارسال سریع
const quickResult = await backupEmailService.quickBackupAndEmail(
    'user@example.com'
);

// تست سیستم
const systemTest = await backupEmailService.testBackupEmailSystem();

// دریافت آمار
const stats = await backupEmailService.getBackupStats();
```

## ⚙️ تنظیمات پیشرفته

### 1. تنظیم گیرندگان پیش‌فرض

```typescript
import { settingsService } from '@/lib/settings-service';

await settingsService.setBackupConfig({
    enabled: true,
    schedule: 'daily',
    time: '02:00',
    emailRecipients: [
        'admin@company.com',
        'backup@company.com'
    ],
    retentionDays: 30,
    compression: true
});
```

### 2. تنظیمات ایمیل سفارشی

```typescript
await settingsService.setEmailConfig({
    enabled: true,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: true,
    smtp_user: 'your-email@gmail.com',
    smtp_password: 'your-app-password'
});
```

## 📊 مانیتورینگ و لاگ‌ها

### 1. بررسی وضعیت سیستم

```bash
# تست mysqldump
mysqldump --version

# تست اتصال دیتابیس
mysql -h localhost -u root -p1234 -e "SHOW DATABASES;"

# بررسی فضای دیسک
df -h
```

### 2. مشاهده لاگ‌ها

```sql
-- تاریخچه بک‌آپ‌ها
SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 10;

-- لاگ‌های سیستم
SELECT * FROM system_logs WHERE log_type = 'backup' ORDER BY created_at DESC;
```

### 3. آمار بک‌آپ‌ها

```sql
-- آمار 30 روز گذشته
SELECT 
    COUNT(*) as total_backups,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    AVG(file_size) as avg_size
FROM backup_history 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🔒 امنیت

### 1. محافظت از فایل‌های بک‌آپ

```bash
# تنظیم مجوزهای فایل
chmod 600 backups/*.sql*
chown www-data:www-data backups/

# رمزگذاری فایل‌ها (اختیاری)
gpg --symmetric --cipher-algo AES256 backup.sql
```

### 2. محدودیت دسترسی API

```typescript
// اضافه کردن authentication به API
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ادامه کد...
}
```

## 🚨 عیب‌یابی

### مشکلات رایج:

#### 1. mysqldump موجود نیست
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# CentOS/RHEL
sudo yum install mysql

# macOS
brew install mysql-client
```

#### 2. خطای اتصال دیتابیس
```bash
# بررسی اتصال
mysql -h localhost -u root -p1234 -e "SELECT 1;"

# بررسی مجوزها
GRANT ALL PRIVILEGES ON crm_system.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. خطای ارسال ایمیل
- بررسی App Password در Gmail
- فعال‌سازی "Less secure app access" (توصیه نمی‌شود)
- استفاده از OAuth2 (پیشرفته)

#### 4. فضای دیسک کم
```bash
# پاک‌سازی بک‌آپ‌های قدیمی
find backups/ -name "*.sql*" -mtime +30 -delete

# فشرده‌سازی فایل‌های موجود
gzip backups/*.sql
```

## 📈 بهینه‌سازی

### 1. بهبود سرعت بک‌آپ

```sql
-- استفاده از --single-transaction برای InnoDB
mysqldump --single-transaction --routines --triggers

-- حذف جداول غیرضروری
--ignore-table=database.logs
--ignore-table=database.sessions
```

### 2. کاهش حجم فایل

```bash
# فشرده‌سازی بالا
gzip -9 backup.sql

# استفاده از xz (فشرده‌سازی بهتر)
xz -9 backup.sql
```

### 3. بک‌آپ تدریجی

```sql
-- بک‌آپ فقط ساختار
mysqldump --no-data database > structure.sql

-- بک‌آپ فقط داده‌ها
mysqldump --no-create-info database > data.sql
```

## 🔄 زمان‌بندی خودکار

### 1. استفاده از Cron

```bash
# ویرایش crontab
crontab -e

# اجرای روزانه در ساعت 2 صبح
0 2 * * * cd /path/to/project && node quick-test-backup-email.js admin@company.com

# اجرای هفتگی
0 2 * * 0 cd /path/to/project && node test-backup-email-complete.js
```

### 2. استفاده از Node.js Scheduler

```typescript
import cron from 'node-cron';
import { backupEmailService } from '@/lib/backup-email-service';

// روزانه در ساعت 2 صبح
cron.schedule('0 2 * * *', async () => {
    console.log('شروع بک‌آپ خودکار...');
    
    const result = await backupEmailService.createBackupAndSendEmail({
        compress: true,
        sendEmail: true
    });
    
    if (result.success) {
        console.log('بک‌آپ خودکار موفق بود');
    } else {
        console.error('خطا در بک‌آپ خودکار:', result.error);
    }
});
```

## 📞 پشتیبانی

در صورت بروز مشکل:

1. ابتدا فایل‌های تست را اجرا کنید
2. لاگ‌های سیستم را بررسی کنید
3. تنظیمات دیتابیس و ایمیل را چک کنید
4. مجوزهای فایل‌ها را بررسی کنید

---

**نکته مهم:** همیشه قبل از استفاده در محیط تولید، سیستم را در محیط تست آزمایش کنید.