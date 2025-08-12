# راهنمای راه‌اندازی سرویس پیامک

## 🚀 ویژگی‌های سرویس پیامک

سیستم از 4 ارائه‌دهنده پیامک ایرانی پشتیبانی می‌کند:

- **کاوه نگار** (KaveNegar)
- **ملی پیامک** (MelliPayamak)  
- **قاصدک** (Ghasedak)
- **فراپیامک** (Farapayamak)

## ⚙️ تنظیمات

### 1. کاوه نگار (پیشنهادی)

```env
KAVENEGAR_API_KEY="your_api_key_here"
KAVENEGAR_SENDER="10008663"
```

**مراحل دریافت API Key:**
1. به سایت [kavenegar.com](https://kavenegar.com) مراجعه کنید
2. ثبت‌نام کنید و حساب کاربری ایجاد کنید
3. از بخش تنظیمات، API Key را کپی کنید
4. شماره فرستنده را از پنل دریافت کنید

### 2. ملی پیامک

```env
MELLIPAYAMAK_USERNAME="your_username"
MELLIPAYAMAK_PASSWORD="your_password"
MELLIPAYAMAK_SENDER="50004001"
```

### 3. قاصدک

```env
GHASEDAK_API_KEY="your_api_key"
GHASEDAK_SENDER="10008566"
```

### 4. فراپیامک

```env
FARAPAYAMAK_USERNAME="your_username"
FARAPAYAMAK_PASSWORD="your_password"
FARAPAYAMAK_SENDER="983000505"
```

## 🔧 نحوه کار سیستم

1. **Auto-Detection**: سیستم به صورت خودکار اولین ارائه‌دهنده موجود را انتخاب می‌کند
2. **Fallback**: اگر یک ارائه‌دهنده کار نکند، به بعدی می‌رود
3. **Validation**: شماره‌های موبایل ایران را تشخیص و اعتبارسنجی می‌کند
4. **Rate Limiting**: بین ارسال پیامک‌ها تأخیر اعمال می‌شود

## 📱 کاربردهای سیستم

### 1. اطلاع‌رسانی پیام جدید چت
```javascript
// خودکار فعال می‌شود وقتی پیام جدیدی در چت ارسال شود
await notificationService.sendNewMessageSMS(
    phoneNumber,
    userName, 
    senderName,
    messageContent
);
```

### 2. ارسال پیامک دستی
```javascript
const smsService = require('./lib/sms-service.js');

await smsService.sendSMS({
    to: '09123456789',
    message: 'متن پیامک شما'
});
```

### 3. ارسال گروهی
```javascript
await smsService.sendBulkSMS([
    { to: '09123456789', message: 'پیام 1' },
    { to: '09123456790', message: 'پیام 2' }
]);
```

### 4. استفاده از تمپلیت
```javascript
await smsService.sendTemplateSMS(
    '09123456789',
    'سلام {name}، پیام جدیدی دارید از {sender}',
    { name: 'احمد', sender: 'علی' }
);
```

## 🧪 تست سیستم

### 1. تست اتصال
```
http://localhost:3000/test-sms
```

### 2. تست از کد
```javascript
// تست اتصال
const connectionTest = await smsService.testConnection();
console.log('Connection:', connectionTest);

// تست ارسال
const result = await smsService.sendSMS({
    to: '09123456789',
    message: 'تست پیامک'
});
console.log('Result:', result);
```

## 📋 فرمت‌های پشتیبانی شده

### شماره تلفن
- `09123456789` ✅
- `+989123456789` ✅
- `00989123456789` ✅
- `989123456789` ✅

### محدودیت‌های متن
- **پیامک ساده**: 160 کاراکتر
- **پیامک فارسی**: 70 کاراکتر
- **پیامک طولانی**: تقسیم به چند پیامک

## 🔍 عیب‌یابی

### مشکلات رایج:

1. **"SMS service not configured"**
   - بررسی کنید متغیرهای محیطی تنظیم شده باشند
   - حداقل یک ارائه‌دهنده باید فعال باشد

2. **"شماره تلفن نامعتبر است"**
   - فرمت شماره را بررسی کنید
   - فقط شماره‌های موبایل ایران پذیرفته می‌شوند

3. **"خطا در ارسال پیامک"**
   - اعتبار حساب کاربری را بررسی کنید
   - شماره فرستنده باید تأیید شده باشد
   - اتصال اینترنت را بررسی کنید

4. **تأخیر در ارسال**
   - این طبیعی است و بستگی به ارائه‌دهنده دارد
   - معمولاً 1-5 دقیقه طول می‌کشد

### لاگ‌های مفید:
```bash
# مشاهده لاگ‌های سیستم
tail -f logs/app.log | grep SMS

# تست دستی
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"09123456789","message":"تست"}'
```

## 💡 نکات بهینه‌سازی

1. **انتخاب ارائه‌دهنده**: کاوه نگار معمولاً سریع‌تر و قابل اعتمادتر است
2. **مدیریت هزینه**: پیامک‌های طولانی هزینه بیشتری دارند
3. **Rate Limiting**: بین ارسال پیامک‌ها فاصله بگذارید
4. **Monitoring**: لاگ‌های ارسال را نظارت کنید

## 🔐 امنیت

- API Key ها را در فایل `.env` نگهداری کنید
- هرگز API Key ها را در کد commit نکنید
- دسترسی به API های پیامک را محدود کنید
- از HTTPS برای ارسال درخواست‌ها استفاده کنید

## 📞 پشتیبانی

اگر مشکلی دارید:
1. ابتدا مستندات ارائه‌دهنده پیامک را بررسی کنید
2. تست اتصال را انجام دهید
3. لاگ‌های سیستم را بررسی کنید
4. با تیم فنی تماس بگیرید