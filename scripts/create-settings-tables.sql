-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Create backup_history table for tracking backups
CREATE TABLE IF NOT EXISTS backup_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('manual', 'automatic') NOT NULL,
    status ENUM('in_progress', 'completed', 'failed') NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    error_message TEXT,
    email_recipient VARCHAR(255),
    initiated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_backup_status (status),
    INDEX idx_backup_type (type),
    INDEX idx_backup_created_at (created_at DESC)
);

-- Create system_logs table for system activity logging
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSON,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_log_created_at (created_at DESC)
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('backup_config', JSON_OBJECT(
    'enabled', false,
    'schedule', 'daily',
    'time', '02:00',
    'emailRecipients', JSON_ARRAY(),
    'retentionDays', 30,
    'compression', true
), 'Backup configuration settings'),
('email_config', JSON_OBJECT(
    'enabled', true,
    'smtp_host', '',
    'smtp_port', 587,
    'smtp_secure', true,
    'smtp_user', '',
    'smtp_password', ''
), 'Email service configuration'),
('system_monitoring', JSON_OBJECT(
    'enabled', true,
    'checkInterval', 300,
    'alertThresholds', JSON_OBJECT(
        'diskSpace', 85,
        'memory', 90,
        'cpu', 80
    )
), 'System monitoring configuration')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);