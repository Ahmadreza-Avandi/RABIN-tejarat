# راهنمای تنظیم سیستم تبدیل صدا به متن

## مقدمه

سیستم تحلیل صوتی از چندین سرویس مختلف برای تبدیل صدا به متن استفاده می‌کند:

1. **Advanced Speech-to-Text**: ضبط صدا و ارسال به سرور
2. **Web Speech API**: تشخیص آنلاین مرورگر
3. **OpenAI Whisper**: سرویس هوش مصنوعی OpenAI
4. **Google Speech-to-Text**: سرویس گوگل
5. **Local Processing**: پردازش محلی (آزمایشی)

## تنظیمات مورد نیاز

### 1. OpenAI Whisper API

برای استفاده از OpenAI Whisper، کلید API را در فایل `.env` اضافه کنید:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Google Speech-to-Text API

برای استفاده از Google Speech، کلید API را در فایل `.env` اضافه کنید:

```bash
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key-here
```

### 3. تنظیمات مرورگر

برای استفاده از میکروفون، مرورگر باید:
- از HTTPS استفاده کند (یا localhost باشد)
- دسترسی به میکروفون داشته باشد
- از MediaRecorder API پشتیبانی کند

## نحوه کار سیستم

### مرحله 1: تشخیص قابلیت‌ها
سیستم ابتدا بررسی می‌کند که کدام سرویس‌ها در دسترس هستند.

### مرحله 2: انتخاب بهترین روش
اولویت استفاده:
1. Advanced Speech-to-Text (اگر مرورگر پشتیبانی کند)
2. Web Speech API (fallback)
3. Manual Input (fallback نهایی)

### مرحله 3: پردازش صدا
برای Advanced Speech-to-Text:
1. ضبط صدا با MediaRecorder
2. ارسال فایل صوتی به سرور
3. تلاش با OpenAI Whisper
4. در صورت عدم موفقیت، تلاش با Google Speech
5. در صورت عدم موفقیت، استفاده از Local Processing

## تست سیستم

### تست از طریق UI
1. به صفحه `/dashboard/insights/audio-analysis` بروید
2. روی دکمه "تست ضبط پیشرفته" کلیک کنید
3. اجازه دسترسی به میکروفون را بدهید
4. 5 ثانیه صحبت کنید
5. نتیجه را بررسی کنید

### تست API مستقیم

```bash
# تست OpenAI Whisper
curl -X POST http://localhost:3000/api/voice-analysis/openai-whisper \
  -F "file=@test-audio.webm" \
  -F "model=whisper-1" \
  -F "language=fa"

# تست Google Speech
curl -X POST http://localhost:3000/api/voice-analysis/google-speech \
  -F "audio=@test-audio.webm" \
  -F "language=fa-IR"

# تست Local Processing
curl -X POST http://localhost:3000/api/voice-analysis/local-speech \
  -F "audio=@test-audio.webm"
```

## عیب‌یابی

### مشکلات رایج

1. **میکروفون کار نمی‌کند**
   - بررسی کنید که سایت از HTTPS استفاده می‌کند
   - دسترسی میکروفون را در مرورگر فعال کنید
   - مرورگر را restart کنید

2. **OpenAI API کار نمی‌کند**
   - کلید API را بررسی کنید
   - اعتبار حساب OpenAI را چک کنید
   - لاگ‌های سرور را بررسی کنید

3. **Google Speech کار نمی‌کند**
   - کلید Google Cloud API را بررسی کنید
   - Speech-to-Text API را در Google Cloud فعال کنید
   - Billing را در Google Cloud فعال کنید

4. **فایل صوتی ارسال نمی‌شود**
   - فرمت فایل را بررسی کنید (webm, mp4, wav)
   - حجم فایل را چک کنید (حداکثر 25MB)
   - تنظیمات Next.js برای حجم فایل را بررسی کنید

### لاگ‌های مفید

```javascript
// در Developer Console مرورگر
console.log('Speech-to-Text Status:', advancedSpeechToText.getStatus());
console.log('Audio Intelligence Status:', audioIntelligenceService.getSystemStatus());
```

## بهینه‌سازی

### برای دقت بهتر
- از محیط آرام استفاده کنید
- میکروفون با کیفیت استفاده کنید
- به وضوح و آهسته صحبت کنید
- از کلمات کلیدی استفاده کنید

### برای سرعت بهتر
- OpenAI API key را تنظیم کنید
- از CDN برای فایل‌های استاتیک استفاده کنید
- Cache کردن نتایج را فعال کنید

## امنیت

- کلیدهای API را در فایل `.env` نگه دارید
- از HTTPS استفاده کنید
- فایل‌های صوتی را پس از پردازش حذف کنید
- Rate limiting را فعال کنید

## پشتیبانی

اگر مشکلی داشتید:
1. لاگ‌های مرورگر را بررسی کنید
2. لاگ‌های سرور را چک کنید
3. تنظیمات API را بررسی کنید
4. با تیم پشتیبانی تماس بگیرید