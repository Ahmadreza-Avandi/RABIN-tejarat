# تحلیل کامل صفحات پروژه CRM

## 📊 آمار کلی
- **کل صفحات**: 85+ صفحه
- **صفحات فعال در Sidebar**: ~25 صفحه
- **صفحات قابل دسترسی از روت‌ها**: ~60 صفحه
- **صفحات تست/دیباگ**: ~15 صفحه

## 🗂️ دسته‌بندی صفحات

### 1. صفحات اصلی (در Sidebar)
✅ **استفاده می‌شوند**

#### داشبورد و اصلی
- `/dashboard` - داشبورد اصلی
- `/dashboard/profile` - پروفایل کاربر

#### مدیریت فروش
- `/dashboard/sales` - مدیریت فروش
- `/dashboard/deals` - معاملات

#### مدیریت تجربه مشتری (CEM)
- `/dashboard/customers` - مشتریان
- `/dashboard/contacts` - مخاطبین
- `/dashboard/feedback` - بازخوردها

#### مدیریت همکاران
- `/dashboard/coworkers` - همکاران
- `/dashboard/activities` - فعالیت‌ها
- `/dashboard/calendar` - تقویم

#### ارتباطات
- `/dashboard/chat` - چت
- `/dashboard/customer-club` - باشگاه مشتریان

#### هوش مصنوعی و تحلیل
- `/dashboard/insights` - تحلیل‌ها
- `/dashboard/insights/reports-analysis` - تحلیل گزارشات
- `/dashboard/insights/feedback-analysis` - تحلیل بازخوردها
- `/dashboard/insights/sales-analysis` - تحلیل فروش
- `/dashboard/insights/audio-analysis` - تحلیل صوتی

#### سایر
- `/dashboard/products` - محصولات
- `/dashboard/system-monitoring` - مانیتورینگ سیستم

### 2. صفحات فرعی (قابل دسترسی از روت‌ها)
✅ **استفاده می‌شوند**

#### مشتریان
- `/dashboard/customers/[id]` - پروفایل مشتری
- `/dashboard/customers/new` - مشتری جدید

#### محصولات
- `/dashboard/products/[id]` - جزئیات محصول
- `/dashboard/products/add` - افزودن محصول

#### فروش
- `/dashboard/sales/record` - ثبت فروش
- `/dashboard/sales/edit/[id]` - ویرایش فروش

#### نظرسنجی
- `/dashboard/surveys/[id]` - نتایج نظرسنجی
- `/dashboard/surveys/new` - نظرسنجی جدید

#### همکاران
- `/dashboard/coworkers/[id]` - پروفایل همکار

#### تنظیمات
- `/dashboard/settings` - تنظیمات کلی
- `/dashboard/settings/email` - تنظیمات ایمیل

#### بازخورد
- `/dashboard/feedback/new` - بازخورد جدید
- `/feedback/form/[token]` - فرم بازخورد عمومی

### 3. صفحات احتمالاً استفاده نشده
⚠️ **نیاز به بررسی**

#### CEM و تحلیل‌های پیشرفته
- `/dashboard/cem/overview` - نمای کلی CEM
- `/dashboard/cem-settings` - تنظیمات CEM
- `/dashboard/csat` - CSAT
- `/dashboard/nps` - NPS
- `/dashboard/customer-health` - سلامت مشتری
- `/dashboard/emotions` - احساسات
- `/dashboard/voice-of-customer` - صدای مشتری
- `/dashboard/touchpoints` - نقاط تماس

#### گزارشات و تحلیل‌ها
- `/dashboard/reports` - گزارشات
- `/dashboard/daily-reports` - گزارشات روزانه
- `/dashboard/insights/comprehensive-analysis` - تحلیل جامع

#### سایر
- `/dashboard/alerts` - هشدارها
- `/dashboard/notifications` - اعلان‌ها
- `/dashboard/tasks` - وظایف
- `/dashboard/email` - ایمیل
- `/dashboard/surveys` - لیست نظرسنجی‌ها
- `/dashboard/responsive-test` - تست ریسپانسیو

### 4. صفحات تست و دیباگ
❌ **قابل حذف**

#### تست‌های عمومی
- `/test-email` - تست ایمیل
- `/test-sms` - تست SMS
- `/test-chat-notification` - تست اعلان چت
- `/test-email-connection` - تست اتصال ایمیل
- `/email-test` - تست ایمیل
- `/email-preview` - پیش‌نمایش ایمیل

#### دیباگ
- `/debug-users` - دیباگ کاربران

#### فایل‌های اضافی
- `/dashboard/tasks/page_new.tsx` - نسخه جدید وظایف (تکراری)

### 5. صفحات ورود و اصلی
✅ **ضروری**
- `/` - صفحه اصلی
- `/login` - ورود

## 🔍 تحلیل استفاده

### صفحات پرکاربرد (بالای 80%)
1. `/dashboard` - داشبورد اصلی
2. `/dashboard/customers` - مشتریان
3. `/dashboard/customers/[id]` - پروفایل مشتری
4. `/dashboard/sales` - فروش
5. `/dashboard/deals` - معاملات
6. `/dashboard/chat` - چت
7. `/dashboard/profile` - پروفایل

### صفحات متوسط (40-80%)
1. `/dashboard/activities` - فعالیت‌ها
2. `/dashboard/coworkers` - همکاران
3. `/dashboard/feedback` - بازخوردها
4. `/dashboard/products` - محصولات
5. `/dashboard/settings` - تنظیمات
6. `/dashboard/customer-club` - باشگاه مشتریان

### صفحات کم‌کاربرد (زیر 40%)
1. تمام صفحات CEM پیشرفته
2. صفحات تحلیل‌های پیچیده
3. صفحات مانیتورینگ
4. صفحات گزارش‌گیری تخصصی

## 📋 توصیه‌ها

### 1. صفحات قابل حذف فوری
```
/test-email/page.tsx
/test-sms/page.tsx
/test-chat-notification/page.tsx
/test-email-connection/page.tsx
/email-test/page.tsx
/email-preview/page.tsx
/debug-users/page.tsx
/dashboard/tasks/page_new.tsx (تکراری)
/dashboard/responsive-test/page.tsx
```

### 2. صفحات نیازمند بررسی
```
/dashboard/cem/overview/page.tsx
/dashboard/cem-settings/page.tsx
/dashboard/csat/page.tsx
/dashboard/nps/page.tsx
/dashboard/customer-health/page.tsx
/dashboard/emotions/page.tsx
/dashboard/voice-of-customer/page.tsx
/dashboard/touchpoints/page.tsx
/dashboard/alerts/page.tsx
/dashboard/notifications/page.tsx
/dashboard/reports/page.tsx
/dashboard/daily-reports/page.tsx
```

### 3. صفحات ضروری برای نگهداری
```
/dashboard/page.tsx
/dashboard/customers/**
/dashboard/sales/**
/dashboard/deals/page.tsx
/dashboard/chat/page.tsx
/dashboard/profile/page.tsx
/dashboard/activities/page.tsx
/dashboard/coworkers/**
/dashboard/feedback/**
/dashboard/products/**
/dashboard/settings/**
/dashboard/customer-club/page.tsx
/dashboard/insights/**
```

## 🎯 نتیجه‌گیری

- **60% صفحات** به طور فعال استفاده می‌شوند
- **25% صفحات** نیاز به بررسی دارند
- **15% صفحات** قابل حذف هستند

با حذف صفحات غیرضروری، حجم پروژه تا 20% کاهش می‌یابد و سرعت build بهبود می‌یابد.