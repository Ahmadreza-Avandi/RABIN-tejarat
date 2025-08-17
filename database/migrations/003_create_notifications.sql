-- Migration: Create notifications table

USE crm_system;

-- Create notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `is_read` boolean DEFAULT false,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  KEY `idx_notifications_created` (`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample notifications for CEO
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`) VALUES
(uuid(), 'ceo-001', 'خوش آمدید', 'به سیستم مدیریت CRM خوش آمدید', 'success'),
(uuid(), 'ceo-001', 'گزارش فروش', 'گزارش فروش ماهانه آماده شده است', 'info');

-- Verify the table
DESCRIBE notifications;