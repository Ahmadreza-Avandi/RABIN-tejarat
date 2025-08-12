# 🔧 راهنمای تنظیم فایل .env

## مراحل تنظیم

### 1. کپی کردن فایل نمونه
```bash
cp .env.example .env
```

### 2. تنظیمات ضروری (حتماً باید تغییر بدی)

#### 🗄️ دیتابیس
```env
# برای Docker (پیشنهادی)
DATABASE_URL="mysql://root:1234@mysql:3306/crm_system"

# برای نصب محلی
# DATABASE_URL="mysql://root:your_password@localhost:3306/crm_system"
```

#### 🌐 دامنه و امنیت
```env
# دامنه سایت
NEXTAUTH_URL="https://ahmadreza-avandi.ir"

# کلید امنیتی (حتماً تغییر بده!)
NEXTAUTH_SECRET="your_super_secret_key_here"
JWT_SECRET="your_jwt_secret_key_here"
```

#### 👤 ایمیل مدیر
```env
CEO_EMAIL="admin@ahmadreza-avandi.ir"
ADMIN_EMAIL="admin@ahmadreza-avandi.ir"
```

### 3. تنظیمات اختیاری

#### 📧 ایمیل (برای ارسال اطلاع‌رسانی)

**روش 1: Gmail API (پیشنهادی)**
1. برو به [Google Cloud Console](https://console.cloud.google.com/)
2. پروژه جدید بساز یا یکی انتخاب کن
3. Gmail API رو فعال کن
4. OAuth 2.0 credentials بساز
5. از [OAuth Playground](https://developers.google.com/oauthplayground/) refresh token بگیر

```env
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_REFRESH_TOKEN="your_refresh_token"
EMAIL_USER="your_email@gmail.com"
```

**روش 2: Gmail SMTP (ساده‌تر)**
1. برو به تنظیمات Gmail
2. 2-Step Verification رو فعال کن
3. App Password بساز
4. App Password رو در .env بذار

```env
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
```

#### 📱 SMS (برای ارسال پیامک)

**کاوه‌نگار (پیشنهادی)**
1. ثبت‌نام در [kavenegar.com](https://kavenegar.com)
2. API Key بگیر

```env
KAVENEGAR_API_KEY="your_api_key"
SMS_PROVIDER="kavenegar"
```

**سایر ارائه‌دهندگان**
- ملی‌پیامک، قاصدک، فراپیامک هم پشتیبانی می‌شن
- خط مربوطه رو uncomment کن و اطلاعات رو پر کن

### 4. تولید کلیدهای امنیتی

```bash
# تولید کلید تصادفی قوی
openssl rand -base64 32

# یا
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. مثال فایل .env کامل برای production

```env
# Database
DATABASE_URL="mysql://root:1234@mysql:3306/crm_system"

# App
NODE_ENV="production"
NEXTAUTH_URL="https://ahmadreza-avandi.ir"
NEXTAUTH_SECRET="generated_secret_key_here"
JWT_SECRET="another_generated_secret_key"

# Admin
CEO_EMAIL="admin@ahmadreza-avandi.ir"
ADMIN_EMAIL="admin@ahmadreza-avandi.ir"

# Email (اختیاری)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"

# SMS (اختیاری)
KAVENEGAR_API_KEY="your_kavenegar_api_key"
SMS_PROVIDER="kavenegar"
SMS_ENABLED="true"

# Company
COMPANY_NAME="شرکت تجارت رابین"
COMPANY_PHONE="+98-21-12345678"
```

## نکات مهم امنیتی

### ✅ حتماً انجام بده:
- کلیدهای امنیتی رو تغییر بده
- پسوردهای قوی استفاده کن
- فایل .env رو به گیت commit نکن
- دسترسی فایل .env رو محدود کن: `chmod 600 .env`

### ❌ هرگز انجام نده:
- کلیدهای امنیتی رو در کد قرار نده
- فایل .env رو public نکن
- پسوردهای ساده استفاده نکن

## تست تنظیمات

```bash
# تست اتصال دیتابیس
docker-compose exec mysql mysql -u root -p1234 -e "SHOW DATABASES;"

# تست health endpoint
curl http://localhost:3000/api/health

# مشاهده لاگ‌ها برای خطاهای تنظیمات
docker-compose logs nextjs
```

## عیب‌یابی

### خطای اتصال دیتابیس:
- چک کن MySQL container در حال اجرا باشه
- پسورد و نام دیتابیس رو بررسی کن

### خطای ایمیل:
- App Password رو درست وارد کرده باشی
- 2-Step Verification فعال باشه

### خطای SMS:
- API Key معتبر باشه
- اعتبار حساب کافی باشه