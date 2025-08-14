# تفکیک 106 صفحه Build شده

## API Routes (حدود 70 تا):
```
/api/activities
/api/auth/login
/api/auth/logout  
/api/auth/me
/api/backup/create
/api/chat/conversations
/api/customers/[id]
/api/email/send
... و خیلی بیشتر
```
**چرا 0 KB؟** چون server-side هستن و در client bundle نمیان

## Dynamic Routes (حدود 15 تا):
```
/dashboard/customers/[id]
/dashboard/coworkers/[id] 
/dashboard/products/[id]
/dashboard/sales/edit/[id]
/dashboard/surveys/[id]
```
**چرا در sidebar نیستن؟** چون dynamic هستن، فقط وقتی کاربر روی لینک کلیک کنه باز میشن

## Sub Pages (حدود 10 تا):
```
/dashboard/customers/new
/dashboard/products/add
/dashboard/feedback/new
/dashboard/surveys/new
/dashboard/settings/email
```
**چرا در sidebar نیستن؟** چون sub-page هستن، از طریق دکمه‌های داخل صفحات اصلی دسترسی دارن

## System Pages (حدود 5 تا):
```
/ (home page)
/_not-found
/login
/feedback/form/[token]
```

## Sidebar Items (فقط حدود 15 تا):
```
/dashboard (داشبورد)
/dashboard/customers (مشتریان)
/dashboard/contacts (مخاطبین) 
/dashboard/deals (معاملات)
/dashboard/chat (چت)
/dashboard/reports (گزارشات)
/dashboard/products (محصولات)
/dashboard/settings (تنظیمات)
... و چند تای دیگه
```

## نتیجه:
- **106 صفحه:** همه چیز (API + Pages + Dynamic + Sub-pages)
- **Sidebar:** فقط صفحات اصلی که کاربر مستقیماً بهشون دسترسی داره
- **0 KB API routes:** چون server-side هستن، نه client-side