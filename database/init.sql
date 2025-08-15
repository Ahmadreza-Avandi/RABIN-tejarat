-- Database initialization script
-- This file will be automatically executed when MySQL container starts

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE crm_system;

-- Grant privileges
GRANT ALL PRIVILEGES ON crm_system.* TO 'root'@'%';
FLUSH PRIVILEGES;