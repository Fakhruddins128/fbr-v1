-- Migration: Add InitialStock and calculation logic for Inventory Management
-- This migration adds necessary fields to the Items table and ensures company isolation.

USE FBR_SaaS;
GO

-- 1. Add InitialStock to Items table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Items') AND name = 'InitialStock')
BEGIN
    ALTER TABLE Items
    ADD InitialStock DECIMAL(18, 2) NOT NULL DEFAULT 0;
    
    PRINT 'InitialStock column added to Items table successfully.';
END
ELSE
BEGIN
    PRINT 'InitialStock column already exists in Items table.';
END
GO

-- 2. Update existing items to have 0 initial stock if they were NULL (shouldn't happen with DEFAULT but for safety)
UPDATE Items SET InitialStock = 0 WHERE InitialStock IS NULL;
GO

PRINT 'Inventory migration completed successfully.';
GO
