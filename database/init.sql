-- Secure Database initialization script
-- This file will be automatically executed when MySQL container starts

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE crm_system;

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY 'Cr@M_App_Us3r_2024!@#$%';

-- Grant only necessary privileges to application user
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON crm_system.* TO 'crm_app_user'@'%';

-- Import the main database structure and data
SOURCE /docker-entrypoint-initdb.d/crm_system.sql;

-- Security cleanup after import
-- Remove dangerous privileges from root for external connections
-- Root can only connect from localhost
UPDATE mysql.user SET Host='localhost' WHERE User='root' AND Host='%';

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Final privilege flush
FLUSH PRIVILEGES;

-- Verify tables were created
SHOW TABLES;