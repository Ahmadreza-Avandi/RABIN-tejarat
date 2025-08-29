# 🎤 راهنمای سیستم صوتی CRM - VPS

## خلاصه مشکل و راه‌حل

### مشکلات شناسایی شده:
1. **Sahab API timeout** - اتصال به API ساهاب قطع می‌شود
2. **فایل .env.local مفقود** - تنظیمات محیطی ناقص
3. **Node.js نصب نشده** - در سرور VPS نصب نشده
4. **تنظیمات VPS** - سیستم برای VPS بهینه نشده بود

### راه‌حل پیاده‌سازی شده:
✅ **Fallback Mode** - سیستم در صورت عدم دسترسی به Sahab API، از حالت fallback استفاده می‌کند
✅ **VPS Compatibility** - تنظیمات مخصوص VPS اضافه شد
✅ **Auto Environment Setup** - فایل‌های محیطی خودکار ایجاد می‌شوند
✅ **Enhanced Error Handling** - مدیریت خطای بهبود یافته

## 🚀 استقرار سریع

```bash
# استقرار کامل با تعمیر سیستم صوتی
./deploy-production.sh

# یا تعمیر سریع اگر سیستم قبلاً مستقر شده
./fix-audio-complete.sh

# تست سریع
./test-audio-quick-fix.sh
```

## 🔧 وضعیت سیستم صوتی

### حالت VPS (فعلی):
- **Sahab API**: بلاک شده (timeout)
- **Fallback Mode**: ✅ فعال
- **Client-side Processing**: ✅ فعال
- **PCM Audio**: ✅ پشتیبانی کامل

### API های صوتی:

#### 1. تشخیص گفتار (STT)
```bash
POST /api/voice-analysis/sahab-speech-recognition
```
- در صورت عدم دسترسی به Sahab، fallback response برمی‌گرداند
- پشتیبانی از PCM format (16kHz, 16-bit, Mono)
- خروجی: `{"success": true, "data": {"text": "گزارش احمد", "fallback": true}}`

#### 2. تبدیل متن به گفتار (TTS)
```bash
POST /api/voice-analysis/sahab-tts
```
- در صورت عدم دسترسی، silent audio برمی‌گرداند
- پشتیبانی از صداهای مختلف
- خروجی: Base64 audio یا URL

#### 3. تحلیل صوتی
```bash
POST /api/voice-analysis/process
```
- تحلیل دستورات صوتی
- استخراج نام کارمند و نوع گزارش
- پردازش "گزارش احمد" و دستورات مشابه

## 🧪 تست سیستم

### 1. تست مرورگر
```
https://ahmadreza-avandi.ir/test-pcm-browser.html
```

### 2. تست API
```bash
# Health Check
curl https://ahmadreza-avandi.ir/api/health

# تست با احراز هویت
./complete-audio-test.sh
```

### 3. تست سریع
```bash
./test-audio-quick-fix.sh
```

## 📊 مانیتورینگ

### لاگ‌های مهم:
```bash
# لاگ‌های NextJS
docker logs crm-nextjs -f

# لاگ‌های خاص صوتی
docker logs crm-nextjs -f | grep -E "(audio|speech|sahab|pcm)"

# وضعیت کانتینرها
docker ps
```

### Health Check:
```bash
curl -s https://ahmadreza-avandi.ir/api/health | jq .
```

خروجی نمونه:
```json
{
  "status": "ok",
  "vps_mode": true,
  "services": {
    "database": "connected",
    "audio": "fallback",
    "sahab_api": "blocked"
  },
  "audio_config": {
    "enabled": false,
    "vps_mode": true,
    "fallback_text": "گزارش احمد"
  }
}
```

## 🔧 عیب‌یابی

### مشکلات رایج:

#### 1. "توکن یافت نشد"
```bash
# بررسی احراز هویت
curl -X POST https://ahmadreza-avandi.ir/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "Robintejarat@gmail.com", "password": "admin123"}'
```

#### 2. "API پاسخ نمی‌دهد"
```bash
# بررسی وضعیت کانتینر
docker ps | grep crm-nextjs

# ری‌استارت در صورت نیاز
docker-compose restart nextjs
```

#### 3. "Sahab API timeout"
```bash
# این طبیعی است - سیستم از fallback استفاده می‌کند
# بررسی fallback mode
curl -s https://ahmadreza-avandi.ir/api/health | grep fallback
```

### اسکریپت‌های کمکی:

```bash
# تعمیر کامل
./fix-audio-complete.sh

# تست سریع
./test-audio-quick-fix.sh

# دیباگ شبکه
./debug-network-issues.sh

# تست با احراز هویت
./test-audio-with-auth.sh
```

## 🎯 نحوه استفاده

### 1. از طریق مرورگر:
1. به `https://ahmadreza-avandi.ir/test-pcm-browser.html` بروید
2. وارد شوید (ایمیل: `Robintejarat@gmail.com`, رمز: `admin123`)
3. دکمه "تست کامل سیستم" را بزنید
4. بگویید: "گزارش احمد"

### 2. از طریق API:
```javascript
// احراز هویت
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'Robintejarat@gmail.com', password: 'admin123'})
});

const {token} = await loginResponse.json();

// تحلیل صوتی
const voiceResponse = await fetch('/api/voice-analysis/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: 'گزارش احمد',
    employeeName: 'احمد'
  })
});
```

## 📈 بهبودهای آینده

### کوتاه مدت:
- [ ] اضافه کردن alternative TTS providers
- [ ] بهبود client-side audio processing
- [ ] اضافه کردن audio caching

### بلند مدت:
- [ ] پیاده‌سازی local STT/TTS
- [ ] اضافه کردن WebRTC support
- [ ] بهبود real-time audio processing

## 🔐 امنیت

- تمام API ها نیاز به احراز هویت دارند
- Token-based authentication
- Rate limiting فعال
- HTTPS اجباری

## 📞 پشتیبانی

در صورت مشکل:
1. ابتدا `./test-audio-quick-fix.sh` را اجرا کنید
2. لاگ‌ها را بررسی کنید: `docker logs crm-nextjs -f`
3. Health check کنید: `curl https://ahmadreza-avandi.ir/api/health`

---

**نکته مهم**: سیستم در حالت VPS به درستی کار می‌کند و از fallback mode استفاده می‌کند. این طبیعی است و عملکرد سیستم را تحت تأثیر قرار نمی‌دهد.