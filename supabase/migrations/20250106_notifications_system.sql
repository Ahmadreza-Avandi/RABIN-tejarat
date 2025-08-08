-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(36),
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_unread (user_id, is_read)
);

-- Insert some sample notifications for testing
INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
('notif-001', 'user-001', 'task_assigned', '📋 وظیفه جدید: بررسی گزارش فروش', 'وظیفه "بررسی گزارش فروش" به شما اختصاص داده شد. اولویت: 🟡 متوسط', FALSE, NOW() - INTERVAL 1 HOUR),
('notif-002', 'user-001', 'sale_created', '💰 فروش جدید: 15 میلیون تومان', 'فروش جدید توسط احمد محمدی ثبت شد. مشتری: شرکت تکنولوژی پارس', FALSE, NOW() - INTERVAL 2 HOUR),
('notif-003', 'user-001', 'message_received', '💬 پیام جدید از علی رضایی', 'سلام، لطفاً گزارش پروژه را بررسی کنید و نظرتان را اعلام کنید.', FALSE, NOW() - INTERVAL 3 HOUR),
('notif-004', 'user-001', 'project_completed', '🎉 پروژه تکمیل شد: سیستم مدیریت انبار', 'پروژه "سیستم مدیریت انبار" توسط تیم توسعه تکمیل شد', TRUE, NOW() - INTERVAL 1 DAY),
('notif-005', 'user-001', 'activity_completed', '✅ فعالیت تکمیل شد: جلسه با مشتری', 'فعالیت "جلسه با مشتری" توسط سارا احمدی تکمیل شد', TRUE, NOW() - INTERVAL 2 DAY);