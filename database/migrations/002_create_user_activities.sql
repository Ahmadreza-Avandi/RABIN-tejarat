-- Migration: Create user_activities table for tracking user actions

USE crm_system;

-- Create user_activities table
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `user_id` varchar(36) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `description` text,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_activities_user_id` (`user_id`),
  KEY `idx_user_activities_type` (`activity_type`),
  KEY `idx_user_activities_created` (`created_at`),
  CONSTRAINT `fk_user_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add avatar column to users table if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `avatar` varchar(255) NULL AFTER `phone`,
ADD COLUMN IF NOT EXISTS `last_login` timestamp NULL AFTER `avatar`;

-- Verify the changes
DESCRIBE users;
DESCRIBE user_activities;