-- Migration: Add FBR Token field to Companies table
-- This migration adds a field to store company-specific FBR API tokens

USE FBR_SaaS;
GO

-- Check if FBRToken column already exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'FBRToken')
BEGIN
    ALTER TABLE Companies
    ADD FBRToken NVARCHAR(500) NULL;
    
    PRINT 'FBRToken column added to Companies table successfully.';
END
ELSE
BEGIN
    PRINT 'FBRToken column already exists in Companies table.';
END
GO

-- Update the UpdatedAt column to reflect the schema change
UPDATE Companies SET UpdatedAt = GETDATE() WHERE FBRToken IS NULL;
GO

PRINT 'Migration completed: FBR Token field added to Companies table.';