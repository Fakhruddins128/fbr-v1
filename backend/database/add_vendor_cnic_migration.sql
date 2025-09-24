-- Migration script to add CNIC field to Vendors table
USE FBR_SaaS;
GO

-- Add CNIC field to Vendors table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorCNIC')
BEGIN
    ALTER TABLE Vendors ADD VendorCNIC NVARCHAR(15) NULL;
    PRINT 'VendorCNIC column added to Vendors table successfully.';
END
ELSE
BEGIN
    PRINT 'VendorCNIC column already exists in Vendors table.';
END
GO

-- Create index for CNIC field for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vendors_VendorCNIC')
BEGIN
    CREATE INDEX IX_Vendors_VendorCNIC ON Vendors(VendorCNIC);
    PRINT 'Index IX_Vendors_VendorCNIC created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_Vendors_VendorCNIC already exists.';
END
GO

PRINT 'Vendor CNIC migration completed successfully!';