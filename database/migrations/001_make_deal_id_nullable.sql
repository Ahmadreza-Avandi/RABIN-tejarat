-- Migration: Make deal_id nullable in sales table
-- This allows sales to be created without requiring a deal

USE crm_system;

-- Make deal_id nullable in sales table
ALTER TABLE `sales` 
MODIFY COLUMN `deal_id` varchar(36) NULL;

-- Add index for better performance when deal_id is null
CREATE INDEX idx_sales_deal_id_null ON sales(deal_id) WHERE deal_id IS NULL;

-- Update any existing sales with empty deal_id to NULL
UPDATE sales SET deal_id = NULL WHERE deal_id = '';

-- Add comment to document the change
ALTER TABLE `sales` 
COMMENT = 'Sales table - deal_id is now optional to allow direct sales without deals';

-- Verify the change
DESCRIBE sales;