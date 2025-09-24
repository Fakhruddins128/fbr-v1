-- Migration script to add UoM (Unit of Measurement) field to Items table
-- Run this script to update the existing Items table structure

USE [your_database_name]; -- Replace with your actual database name
GO

-- Check if UoM column already exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Items') AND name = 'UoM')
BEGIN
    -- Add UoM column to Items table
    ALTER TABLE Items
    ADD UoM NVARCHAR(20) NULL;
    
    PRINT 'UoM column added to Items table successfully.';
    
    -- Set default UoM values for existing records
    UPDATE Items 
    SET UoM = 'PCS' -- Default to 'PCS' (Pieces)
    WHERE UoM IS NULL;
    
    PRINT 'Default UoM values set for existing records.';
    
    -- Make UoM column NOT NULL after setting default values
    ALTER TABLE Items
    ALTER COLUMN UoM NVARCHAR(20) NOT NULL;
    
    PRINT 'UoM column set to NOT NULL.';
END
ELSE
BEGIN
    PRINT 'UoM column already exists in Items table.';
END
GO