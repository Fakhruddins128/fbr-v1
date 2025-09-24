-- Migration to increase UoM field size from NVARCHAR(20) to NVARCHAR(50)
-- This allows for longer unit of measurement names like "Numbers, pieces, units"

USE [FBR_SaaS];
GO

-- Check if the column exists and its current size
IF EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Items' 
    AND COLUMN_NAME = 'UoM'
    AND CHARACTER_MAXIMUM_LENGTH = 20
)
BEGIN
    PRINT 'Updating UoM field size from NVARCHAR(20) to NVARCHAR(50)...';
    
    -- Alter the column to increase size
    ALTER TABLE Items
    ALTER COLUMN UoM NVARCHAR(50) NOT NULL;
    
    PRINT 'UoM field size updated successfully.';
END
ELSE
BEGIN
    PRINT 'UoM field is already the correct size or does not exist.';
END
GO