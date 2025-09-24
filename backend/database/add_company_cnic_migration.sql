-- Migration script to add CNIC field to Companies table

USE FBR_SaaS;
GO

-- Add CNIC column to Companies table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'CNIC')
BEGIN
    ALTER TABLE Companies
    ADD CNIC NVARCHAR(20) NULL;
    
    PRINT 'CNIC column added to Companies table successfully.';
END
ELSE
BEGIN
    PRINT 'CNIC column already exists in Companies table.';
END
GO

-- Create index for CNIC field for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Companies_CNIC')
BEGIN
    CREATE INDEX IX_Companies_CNIC ON Companies(CNIC);
    PRINT 'Index IX_Companies_CNIC created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_Companies_CNIC already exists.';
END
GO