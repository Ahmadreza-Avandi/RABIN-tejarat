-- Quick fix for sales table to make deal_id optional
-- Run this directly in your MySQL database

USE crm_system;

-- Make deal_id nullable
ALTER TABLE `sales` MODIFY COLUMN `deal_id` varchar(36) NULL;

-- Show the updated structure
DESCRIBE sales;