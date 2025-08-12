# Design Document

## Overview

صفحه تنظیمات سیستم یک رابط کاربری جامع برای مدیریت و نظارت بر سرویس‌های مختلف سیستم است. این صفحه شامل داشبورد وضعیت، مدیریت سرویس ایمیل، سیستم بک‌آپ خودکار و دستی، و تنظیمات عمومی سیستم می‌باشد.

## Architecture

### Frontend Components
- **SystemSettingsPage**: کامپوننت اصلی صفحه تنظیمات
- **StatusDashboard**: داشبورد نمایش وضعیت کلی سیستم
- **EmailServiceSettings**: مدیریت تنظیمات سرویس ایمیل
- **BackupSettings**: مدیریت بک‌آپ خودکار و دستی
- **BackupHistory**: نمایش تاریخچه بک‌آپ‌ها
- **GeneralSettings**: تنظیمات عمومی سیستم

### Backend APIs
- **GET /api/settings/status**: دریافت وضعیت کلی سیستم
- **GET /api/settings/email**: دریافت تنظیمات ایمیل
- **POST /api/settings/email/test**: تست سرویس ایمیل
- **GET /api/settings/backup**: دریافت تنظیمات بک‌آپ
- **POST /api/settings/backup/configure**: تنظیم بک‌آپ خودکار
- **POST /api/settings/backup/manual**: اجرای بک‌آپ دستی
- **GET /api/settings/backup/history**: دریافت تاریخچه بک‌آپ‌ها
- **POST /api/settings/backup/download**: دانلود فایل بک‌آپ
- **POST /api/settings/backup/email**: ارسال بک‌آپ به ایمیل

## Components and Interfaces

### StatusDashboard Component
```typescript
interface SystemStatus {
  emailService: {
    status: 'active' | 'inactive' | 'error';
    lastCheck: string;
    message?: string;
  };
  database: {
    status: 'connected' | 'disconnected';
    lastBackup: string;
    size: string;
  };
  backupService: {
    status: 'enabled' | 'disabled';
    nextScheduled?: string;
    lastRun?: string;
  };
}
```

### EmailServiceSettings Component
```typescript
interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  timestamp: string;
}
```

### BackupSettings Component
```typescript
interface BackupConfig {
  autoBackup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    emailTo: string[];
    retentionDays: number;
  };
  manualBackup: {
    lastRun?: string;
    inProgress: boolean;
    progress?: number;
  };
}

interface BackupHistoryItem {
  id: string;
  type: 'auto' | 'manual';
  timestamp: string;
  status: 'success' | 'failed' | 'in_progress';
  fileSize?: number;
  fileName?: string;
  errorMessage?: string;
  emailSent?: boolean;
}
```

## Data Models

### Settings Table
```sql
CREATE TABLE system_settings (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  value TEXT,
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_key (category, key_name)
);
```

### Backup History Table
```sql
CREATE TABLE backup_history (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('auto', 'manual') NOT NULL,
  status ENUM('success', 'failed', 'in_progress') NOT NULL,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_path VARCHAR(500),
  email_recipients JSON,
  email_sent BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_by VARCHAR(36),
  INDEX idx_type_status (type, status),
  INDEX idx_started_at (started_at)
);
```

### System Status Log Table
```sql
CREATE TABLE system_status_log (
  id VARCHAR(36) PRIMARY KEY,
  service_name VARCHAR(50) NOT NULL,
  status ENUM('active', 'inactive', 'error') NOT NULL,
  message TEXT,
  details JSON,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service_checked (service_name, checked_at)
);
```

## Error Handling

### Email Service Errors
- **Connection Failed**: نمایش پیام خطا و راهنمای عیب‌یابی
- **Authentication Failed**: راهنمای بررسی اعتبارنامه‌ها
- **Send Failed**: نمایش جزئیات خطا و پیشنهاد راه‌حل

### Backup Errors
- **Database Connection Failed**: بررسی اتصال دیتابیس
- **Insufficient Storage**: هشدار کمبود فضای ذخیره‌سازی
- **Email Send Failed**: تلاش مجدد ارسال ایمیل
- **File Generation Failed**: نمایش خطای تولید فایل

### Validation Errors
- **Invalid Email Format**: اعتبارسنجی فرمت ایمیل
- **Invalid Time Format**: اعتبارسنجی فرمت زمان
- **Missing Required Fields**: نمایش فیلدهای اجباری

## Testing Strategy

### Unit Tests
- تست کامپوننت‌های React
- تست توابع utility
- تست validation functions
- تست API handlers

### Integration Tests
- تست اتصال سرویس ایمیل
- تست فرآیند بک‌آپ‌گیری
- تست ارسال ایمیل بک‌آپ
- تست ذخیره و بازیابی تنظیمات

### End-to-End Tests
- تست کامل فرآیند تنظیم بک‌آپ خودکار
- تست کامل فرآیند بک‌آپ دستی
- تست کامل تنظیم سرویس ایمیل
- تست نمایش وضعیت سیستم

## Security Considerations

### Data Protection
- رمزگذاری اطلاعات حساس (پسوردها، API keys)
- محدودیت دسترسی به تنظیمات سیستم
- لاگ‌گذاری تغییرات تنظیمات

### File Security
- محدودیت دسترسی به فایل‌های بک‌آپ
- رمزگذاری فایل‌های بک‌آپ
- پاک‌سازی خودکار فایل‌های موقت

### API Security
- احراز هویت برای تمام API endpoints
- محدودیت نرخ درخواست
- اعتبارسنجی ورودی‌ها

## Performance Considerations

### Backup Performance
- اجرای بک‌آپ در background
- نمایش پیشرفت real-time
- بهینه‌سازی اندازه فایل‌های بک‌آپ

### UI Performance
- Lazy loading برای کامپوننت‌ها
- Caching وضعیت سیستم
- Debouncing برای تست‌های خودکار

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────┐
│ System Settings Header                   │
├─────────────────────────────────────────┤
│ Status Dashboard (Cards Layout)         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Email   │ │Database │ │ Backup  │    │
│ │ Status  │ │ Status  │ │ Status  │    │
│ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────┤
│ Tabs Navigation                         │
│ [Email] [Backup] [General] [History]    │
├─────────────────────────────────────────┤
│ Tab Content Area                        │
│                                         │
└─────────────────────────────────────────┘
```

### Color Scheme
- **Success**: سبز برای سرویس‌های فعال
- **Warning**: نارنجی برای هشدارها
- **Error**: قرمز برای خطاها
- **Info**: آبی برای اطلاعات عمومی

### Interactive Elements
- **Toggle Switches**: برای فعال/غیرفعال کردن سرویس‌ها
- **Progress Bars**: برای نمایش پیشرفت بک‌آپ
- **Status Indicators**: برای نمایش وضعیت سرویس‌ها
- **Action Buttons**: برای اجرای عملیات‌ها