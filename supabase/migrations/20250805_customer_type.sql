/*
  # Customer Type Enhancement
  
  1. Updates
    - Add customer_type field to distinguish between individual and company
    - Update existing data based on segment
    - Add sample individual customers with emails
*/

-- Use the correct database
USE crm_system;

-- Add customer_type column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type ENUM('individual', 'company') DEFAULT 'company';

-- Update existing customers based on segment
UPDATE customers SET customer_type = 'individual' WHERE segment = 'individual';
UPDATE customers SET customer_type = 'company' WHERE segment IN ('enterprise', 'small_business');

-- Add some individual customers with emails for testing
INSERT IGNORE INTO customers (id, name, email, phone, status, segment, customer_type, priority, assigned_to, potential_value, satisfaction_score, industry, company_size) VALUES
('cust-ind-001', 'علی احمدی', 'ali.ahmadi@gmail.com', '۰۹۱۲۳۴۵۶۷۸۹', 'active', 'individual', 'individual', 'medium', 'user-001', 15000000, 4.2, 'خدمات', '1-10'),
('cust-ind-002', 'فاطمه کریمی', 'fateme.karimi@yahoo.com', '۰۹۱۲۳۴۵۶۷۹۰', 'prospect', 'individual', 'individual', 'high', 'user-002', 25000000, NULL, 'تجارت', '1-10'),
('cust-ind-003', 'محمد رضایی', 'mohammad.rezaei@outlook.com', '۰۹۱۲۳۴۵۶۷۹۱', 'follow_up', 'individual', 'individual', 'low', 'user-001', 8000000, 3.8, 'مشاوره', '1-10'),
('cust-ind-004', 'زهرا محمدی', 'zahra.mohammadi@gmail.com', '۰۹۱۲۳۴۵۶۷۹۲', 'active', 'individual', 'individual', 'medium', 'user-003', 12000000, 4.5, 'آموزش', '1-10'),
('cust-ind-005', 'حسن نوری', 'hassan.nouri@gmail.com', '۰۹۱۲۳۴۵۶۷۹۳', 'customer', 'individual', 'individual', 'high', 'user-002', 30000000, 4.7, 'مالی', '1-10');

-- Add contacts for individual customers (they are their own primary contact)
INSERT IGNORE INTO contacts (id, company_id, first_name, last_name, email, phone, job_title, department, is_primary, created_by) VALUES
('cont-ind-001', 'cust-ind-001', 'علی', 'احمدی', 'ali.ahmadi@gmail.com', '۰۹۱۲۳۴۵۶۷۸۹', 'مالک', 'مدیریت', TRUE, 'user-001'),
('cont-ind-002', 'cust-ind-002', 'فاطمه', 'کریمی', 'fateme.karimi@yahoo.com', '۰۹۱۲۳۴۵۶۷۹۰', 'مالک', 'مدیریت', TRUE, 'user-002'),
('cont-ind-003', 'cust-ind-003', 'محمد', 'رضایی', 'mohammad.rezaei@outlook.com', '۰۹۱۲۳۴۵۶۷۹۱', 'مالک', 'مدیریت', TRUE, 'user-001'),
('cont-ind-004', 'cust-ind-004', 'زهرا', 'محمدی', 'zahra.mohammadi@gmail.com', '۰۹۱۲۳۴۵۶۷۹۲', 'مالک', 'مدیریت', TRUE, 'user-003'),
('cont-ind-005', 'cust-ind-005', 'حسن', 'نوری', 'hassan.nouri@gmail.com', '۰۹۱۲۳۴۵۶۷۹۳', 'مالک', 'مدیریت', TRUE, 'user-002');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

SELECT 'Customer type enhancement completed successfully!' as Status;