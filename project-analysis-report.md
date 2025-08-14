# گزارش تحلیل پروژه CRM

## مشکلات اصلی شناسایی شده:

### 1. پوشه‌های خالی و غیرضروری:
- `app/dashboard/cem-settings/` - خالی
- `app/dashboard/customer-health/` - خالی  
- `app/dashboard/daily-reports/` - خالی
- `app/dashboard/emotions/` - خالی
- `app/dashboard/responsive-test/` - خالی
- `app/dashboard/touchpoints/` - خالی
- `app/dashboard/voice-of-customer/` - خالی
- `app/debug-users/` - خالی
- `app/email-preview/` - خالی
- `app/email-test/` - خالی
- `app/test-chat-notification/` - خالی
- `app/test-email/` - خالی
- `app/test-email-connection/` - خالی
- `app/test-sms/` - خالی

### 2. API Routes کم‌استفاده یا غیرضروری:
- `app/api/test-chat-notification/` - فقط برای تست
- `app/api/test-email/` - فقط برای تست
- `app/api/test-email-bulk/` - فقط برای تست
- `app/api/send-email-oauth/` - استفاده نمیشه
- `app/api/reports-analysis/` - کم استفاده
- `app/api/debug/` - فقط برای debug
- `app/api/health/` - ساده و کم استفاده
- `app/api/interactions/` - استفاده نمیشه در frontend
- `app/api/tickets/` - استفاده نمیشه در frontend

### 3. Dependencies سنگین:
- `@mui/material` + `@emotion` - فقط در چند کامپوننت استفاده میشه
- `framer-motion` - فقط در login page
- `chart.js` + `react-chartjs-2` - همزمان با `recharts`
- `recharts` - دوتا chart library
- `moment-jalaali` - برای تاریخ فارسی
- `googleapis` - برای Gmail API

### 4. کامپوننت‌های تکراری:
- دو sidebar مختلف: `sidebar.tsx` و `responsive-sidebar.tsx`
- دو theme system: Material-UI و Tailwind
- چندین email template system

## توصیه‌های بهینه‌سازی:

### فوری (کاهش 40-50% حجم):
1. حذف پوشه‌های خالی
2. حذف API routes غیرضروری
3. حذف یکی از chart libraries
4. حذف Material-UI اگر Tailwind کافیه

### متوسط (کاهش 20-30% زمان بیلد):
1. تجمیع کامپوننت‌های مشابه
2. lazy loading برای صفحات کم‌استفاده
3. بهینه‌سازی imports

### بلندمدت:
1. refactor کردن theme system
2. استفاده از dynamic imports
3. code splitting بهتر