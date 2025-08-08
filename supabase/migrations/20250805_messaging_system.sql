/*
  # Messaging System Tables
  
  1. New Tables
    - message_campaigns: کمپین‌های پیام‌رسانی
    - message_logs: لاگ پیام‌های ارسال شده
    - project_stages: مراحل پروژه‌ها
    - project_members: اعضای پروژه‌ها
  
  2. Updates
    - Add avatar column to users table
    - Update projects table structure
*/

-- Use the correct database
USE crm_system;

-- Add avatar column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL;

-- Create message_campaigns table
CREATE TABLE IF NOT EXISTS message_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('email', 'sms') NOT NULL DEFAULT 'email',
    content TEXT NOT NULL,
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create message_logs table
CREATE TABLE IF NOT EXISTS message_logs (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) DEFAULT NULL,
    contact_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('email', 'sms') NOT NULL DEFAULT 'email',
    subject VARCHAR(255) DEFAULT NULL,
    content TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    error_message TEXT DEFAULT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES message_campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create project_stages table
CREATE TABLE IF NOT EXISTS project_stages (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    sort_order INT DEFAULT 0,
    due_date DATE DEFAULT NULL,
    completed_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('manager', 'member', 'viewer') NOT NULL DEFAULT 'member',
    assigned_by VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Update projects table structure if needed
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tags JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS actual_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS actual_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2) DEFAULT 0.00;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_campaigns_user_id ON message_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_created_at ON message_campaigns(created_at);

CREATE INDEX IF NOT EXISTS idx_message_logs_campaign_id ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_contact_id ON message_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_status ON project_stages(status);
CREATE INDEX IF NOT EXISTS idx_project_stages_sort_order ON project_stages(sort_order);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Insert sample project stages for existing projects
INSERT IGNORE INTO project_stages (id, project_id, name, description, status, sort_order, due_date, created_by) 
SELECT 
    CONCAT('stage-', p.id, '-', seq.seq) as id,
    p.id as project_id,
    CASE seq.seq
        WHEN 1 THEN 'تحلیل نیازمندی‌ها'
        WHEN 2 THEN 'طراحی سیستم'
        WHEN 3 THEN 'توسعه و پیاده‌سازی'
        WHEN 4 THEN 'تست و بررسی'
        WHEN 5 THEN 'راه‌اندازی و تحویل'
    END as name,
    CASE seq.seq
        WHEN 1 THEN 'بررسی و تحلیل نیازمندی‌های پروژه'
        WHEN 2 THEN 'طراحی معماری و رابط کاربری سیستم'
        WHEN 3 THEN 'توسعه و کدنویسی بخش‌های مختلف'
        WHEN 4 THEN 'تست عملکرد و رفع باگ‌ها'
        WHEN 5 THEN 'راه‌اندازی نهایی و تحویل به مشتری'
    END as description,
    CASE seq.seq
        WHEN 1 THEN 'completed'
        WHEN 2 THEN 'in_progress'
        ELSE 'pending'
    END as status,
    seq.seq as sort_order,
    DATE_ADD(p.start_date, INTERVAL (seq.seq * 30) DAY) as due_date,
    p.created_by
FROM projects p
CROSS JOIN (
    SELECT 1 as seq UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5
) seq
WHERE p.start_date IS NOT NULL;

SELECT 'Messaging system tables created successfully!' as Status;