-- Migration script to add ContactPersonName field to Vendors table
USE FBR_SaaS;
GO

-- Add ContactPersonName field to Vendors table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'ContactPersonName')
BEGIN
    ALTER TABLE Vendors ADD ContactPersonName NVARCHAR(255) NULL;
    PRINT 'ContactPersonName column added to Vendors table successfully.';
END
ELSE
BEGIN
    PRINT 'ContactPersonName column already exists in Vendors table.';
END
GO

-- Create index for ContactPersonName field for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vendors_ContactPersonName')
BEGIN
    CREATE INDEX IX_Vendors_ContactPersonName ON Vendors(ContactPersonName);
    PRINT 'Index IX_Vendors_ContactPersonName created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_Vendors_ContactPersonName already exists.';
END
GO

PRINT 'Vendor ContactPersonName migration completed successfully!';