-- جدول تاریخچه بک‌آپ‌ها
CREATE TABLE IF NOT EXISTS backup_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('manual', 'scheduled', 'api') NOT NULL DEFAULT 'manual',
    status ENUM('in_progress', 'completed', 'failed') NOT NULL,
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_size BIGINT NULL COMMENT 'حجم فایل به بایت',
    duration INT NULL COMMENT 'مدت زمان ایجاد بک‌آپ به میلی‌ثانیه',
    error_message TEXT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    email_recipients JSON NULL COMMENT 'لیست گیرندگان ایمیل',
    email_errors JSON NULL COMMENT 'خطاهای ارسال ایمیل',
    compression_enabled BOOLEAN DEFAULT TRUE,
    include_data BOOLEAN DEFAULT TRUE,
    excluded_tables JSON NULL COMMENT 'جداول حذف شده از بک‌آپ',
    created_by INT NULL COMMENT 'شناسه کاربر ایجادکننده',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول تنظیمات سیستم (اگر وجود ندارد)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSON NOT NULL,
    description TEXT NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول لاگ‌های سیستم (اگر وجود ندارد)
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    status ENUM('success', 'error', 'warning', 'info') NOT NULL,
    message TEXT NULL,
    details JSON NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- درج تنظیمات پیش‌فرض بک‌آپ
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
    'backup_config',
    JSON_OBJECT(
        'enabled', true,
        'schedule', 'daily',
        'time', '02:00',
        'emailRecipients', JSON_ARRAY('only.link086@gmail.com'),
        'retentionDays', 30,
        'compression', true,
        'includeData', true,
        'excludeTables', JSON_ARRAY('system_logs', 'sessions')
    ),
    'تنظیمات بک‌آپ خودکار دیتابیس'
) ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    updated_at = CURRENT_TIMESTAMP;

-- درج تنظیمات پیش‌فرض ایمیل
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
    'email_config',
    JSON_OBJECT(
        'enabled', true,
        'smtp_host', 'smtp.gmail.com',
        'smtp_port', 587,
        'smtp_secure', true,
        'smtp_user', '',
        'smtp_password', ''
    ),
    'تنظیمات سرور ایمیل SMTP'
) ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP;

-- درج تنظیمات مانیتورینگ سیستم
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
    'system_monitoring',
    JSON_OBJECT(
        'enabled', true,
        'checkInterval', 300,
        'alertThresholds', JSON_OBJECT(
            'diskSpace', 85,
            'memory', 90,
            'cpu', 80
        ),
        'emailAlerts', true,
        'alertRecipients', JSON_ARRAY('only.link086@gmail.com')
    ),
    'تنظیمات مانیتورینگ و هشدارهای سیستم'
) ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP;

-- ایجاد view برای آمار بک‌آپ‌ها
CREATE OR REPLACE VIEW backup_stats AS
SELECT 
    COUNT(*) as total_backups,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_backups,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_backups,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_backups,
    AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_duration,
    SUM(CASE WHEN status = 'completed' THEN file_size ELSE 0 END) as total_size,
    AVG(CASE WHEN status = 'completed' THEN file_size ELSE NULL END) as avg_size,
    MAX(created_at) as last_backup_date,
    (SELECT status FROM backup_history ORDER BY created_at DESC LIMIT 1) as last_backup_status
FROM backup_history 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ایجاد stored procedure برای پاک‌سازی بک‌آپ‌های قدیمی
DELIMITER //

CREATE PROCEDURE CleanupOldBackups(IN retention_days INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE backup_file VARCHAR(255);
    DECLARE backup_path VARCHAR(500);
    
    -- Cursor برای یافتن بک‌آپ‌های قدیمی
    DECLARE backup_cursor CURSOR FOR 
        SELECT file_name, file_path 
        FROM backup_history 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL retention_days DAY)
        AND status = 'completed'
        AND file_name IS NOT NULL;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- شروع تراکنش
    START TRANSACTION;
    
    -- حذف رکوردهای قدیمی از دیتابیس
    DELETE FROM backup_history 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL retention_days DAY);
    
    -- ثبت لاگ
    INSERT INTO system_logs (log_type, status, message, details) 
    VALUES (
        'backup_cleanup', 
        'success', 
        CONCAT('Cleaned up backups older than ', retention_days, ' days'),
        JSON_OBJECT('retention_days', retention_days, 'deleted_records', ROW_COUNT())
    );
    
    COMMIT;
    
    SELECT CONCAT('Successfully cleaned up backups older than ', retention_days, ' days') as result;
END //

DELIMITER ;

-- ایجاد event برای پاک‌سازی خودکار (اختیاری)
-- CREATE EVENT IF NOT EXISTS auto_cleanup_backups
-- ON SCHEDULE EVERY 1 WEEK
-- STARTS CURRENT_TIMESTAMP
-- DO
--   CALL CleanupOldBackups(30);

-- ایجاد trigger برای ثبت لاگ تغییرات تنظیمات
DELIMITER //

CREATE TRIGGER system_settings_log 
AFTER UPDATE ON system_settings
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (log_type, status, message, details, user_id) 
    VALUES (
        'setting_updated',
        'info',
        CONCAT('System setting updated: ', NEW.setting_key),
        JSON_OBJECT(
            'setting_key', NEW.setting_key,
            'old_value', OLD.setting_value,
            'new_value', NEW.setting_value,
            'updated_by', NEW.updated_by
        ),
        NEW.updated_by
    );
END //

DELIMITER ;