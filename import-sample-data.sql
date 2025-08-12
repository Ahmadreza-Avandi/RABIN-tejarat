-- Import additional sample data for testing

-- Insert sample users if not exists
INSERT IGNORE INTO users (id, name, email, password, role, status, created_at) VALUES
('user-001', 'مدیر سیستم', 'admin@crm.com', '$2b$10$hash', 'admin', 'active', NOW()),
('user-002', 'کارشناس فروش', 'sales@crm.com', '$2b$10$hash', 'sales', 'active', NOW()),
('user-003', 'پشتیبان', 'support@crm.com', '$2b$10$hash', 'support', 'active', NOW());

-- Insert sample notifications
INSERT IGNORE INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
('notif-001', 'ceo-001', 'خوش آمدید', 'به سیستم CRM خوش آمدید', 'info', FALSE, NOW()),
('notif-002', 'ceo-001', 'فروش جدید', 'فروش جدیدی ثبت شد', 'success', FALSE, NOW()),
('notif-003', 'ceo-001', 'بازخورد جدید', 'بازخورد جدیدی دریافت شد', 'info', FALSE, NOW());

-- Update existing data to ensure compatibility
UPDATE customers SET segment = 'small_business' WHERE segment IS NULL OR segment = '';
UPDATE sales SET payment_status = 'paid' WHERE payment_status IS NULL OR payment_status = '';
UPDATE feedback SET type = 'csat' WHERE type IS NULL OR type = '';

-- Insert sample activities if table exists
INSERT IGNORE INTO activities (id, customer_id, type, title, description, created_at) VALUES
('act-001', 'cust-001', 'call', 'تماس تلفنی', 'تماس با مشتری برای پیگیری', NOW()),
('act-002', 'cust-002', 'meeting', 'جلسه حضوری', 'جلسه با مشتری', NOW()),
('act-003', 'cust-003', 'email', 'ارسال ایمیل', 'ارسال پیشنهاد قیمت', NOW());

-- Insert sample deals if table exists
INSERT IGNORE INTO deals (id, customer_id, title, description, total_value, stage_id, probability, assigned_to, created_at) VALUES
('deal-001', 'cust-001', 'فروش محصول A', 'فروش محصول A به مشتری', 5000000, 'stage-001', 75, 'user-002', NOW()),
('deal-002', 'cust-002', 'فروش محصول B', 'فروش محصول B به مشتری', 8000000, 'stage-002', 50, 'user-002', NOW()),
('deal-003', 'cust-003', 'فروش محصول C', 'فروش محصول C به مشتری', 12000000, 'stage-003', 80, 'user-002', NOW());

-- Insert sample products if table exists
INSERT IGNORE INTO products (id, name, description, price, category, status, created_at) VALUES
('prod-001', 'محصول A', 'توضیحات محصول A', 1000000, 'software', 'active', NOW()),
('prod-002', 'محصول B', 'توضیحات محصول B', 2000000, 'hardware', 'active', NOW()),
('prod-003', 'محصول C', 'توضیحات محصول C', 3000000, 'service', 'active', NOW());

-- Insert sample tasks if table exists
INSERT IGNORE INTO tasks (id, title, description, assigned_to, status, priority, due_date, created_at) VALUES
('task-001', 'پیگیری مشتری', 'پیگیری مشتری برای تکمیل فروش', 'user-002', 'pending', 'high', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW()),
('task-002', 'آماده‌سازی پیشنهاد', 'آماده‌سازی پیشنهاد قیمت', 'user-002', 'in_progress', 'medium', DATE_ADD(NOW(), INTERVAL 5 DAY), NOW()),
('task-003', 'بررسی بازخورد', 'بررسی بازخوردهای مشتریان', 'user-003', 'pending', 'low', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW());

-- Update statistics
UPDATE customers SET last_interaction = NOW() WHERE last_interaction IS NULL;
UPDATE users SET last_active = NOW() WHERE last_active IS NULL;