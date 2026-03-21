-- Migration: Add MasterItemID to InvoiceItems table to link with master Items table
-- This allows retrieving master item data when viewing or editing an invoice.

USE FBR_SaaS;
GO

-- 1. Add MasterItemID to InvoiceItems table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'MasterItemID')
BEGIN
    ALTER TABLE InvoiceItems
    ADD MasterItemID UNIQUEIDENTIFIER NULL;
    
    PRINT 'MasterItemID column added to InvoiceItems table successfully.';
END
ELSE
BEGIN
    PRINT 'MasterItemID column already exists in InvoiceItems table.';
END
GO

-- 2. Add foreign key constraint (optional but recommended for data integrity)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InvoiceItems_MasterItem')
BEGIN
    ALTER TABLE InvoiceItems
    ADD CONSTRAINT FK_InvoiceItems_MasterItem 
    FOREIGN KEY (MasterItemID) REFERENCES Items(ItemID);
    
    PRINT 'Foreign key constraint FK_InvoiceItems_MasterItem added successfully.';
END
GO

-- 3. Update MasterItemID for existing records where HSCode and Description match
UPDATE ii
SET ii.MasterItemID = i.ItemID
FROM InvoiceItems ii
JOIN Items i ON ii.HSCode = i.HSCode 
    AND CAST(ii.ProductDescription AS NVARCHAR(MAX)) = CAST(i.Description AS NVARCHAR(MAX))
WHERE ii.MasterItemID IS NULL;

PRINT 'MasterItemID updated for existing matching records.';
GO

PRINT 'InvoiceItems migration completed successfully.';
GO
