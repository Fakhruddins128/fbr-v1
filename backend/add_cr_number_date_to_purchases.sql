-- Add CRNumber and Date columns to Purchases table for CR Number wise inventory management

USE FBR_SaaS;
GO

-- Check if CRNumber column exists, if not add it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchases' AND COLUMN_NAME = 'CRNumber')
BEGIN
    ALTER TABLE Purchases
    ADD CRNumber NVARCHAR(50) NULL;
    PRINT 'CRNumber column added to Purchases table';
END
ELSE
BEGIN
    PRINT 'CRNumber column already exists in Purchases table';
END
GO

-- Check if Date column exists, if not add it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchases' AND COLUMN_NAME = 'Date')
BEGIN
    ALTER TABLE Purchases
    ADD Date DATE NULL;
    PRINT 'Date column added to Purchases table';
END
ELSE
BEGIN
    PRINT 'Date column already exists in Purchases table';
END
GO

-- Create index on CRNumber for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_CRNumber')
BEGIN
    CREATE INDEX IX_Purchases_CRNumber ON Purchases(CRNumber);
    PRINT 'Index IX_Purchases_CRNumber created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_Purchases_CRNumber already exists';
END
GO

-- Create index on Date for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_Date')
BEGIN
    CREATE INDEX IX_Purchases_Date ON Purchases(Date);
    PRINT 'Index IX_Purchases_Date created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_Purchases_Date already exists';
END
GO

PRINT 'Purchases table updated successfully with CRNumber and Date columns for CR Number wise inventory management';