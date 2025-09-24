-- Create Items table with all necessary columns
-- Run this script to create the Items table in the database

USE FBR_SaaS;
GO

-- Create Items Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Items')
BEGIN
    CREATE TABLE Items (
        ItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        HSCode NVARCHAR(50) NOT NULL,
        Description NTEXT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        PurchaseTaxValue DECIMAL(5, 2) DEFAULT 0,
        SalesTaxValue DECIMAL(5, 2) DEFAULT 0,
        UoM NVARCHAR(20) NOT NULL DEFAULT 'PCS',
        IsActive BIT DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        ItemCreateDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
    );
    PRINT 'Table Items created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Items already exists.';
END
GO

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Items_CompanyID')
BEGIN
    CREATE INDEX IX_Items_CompanyID ON Items(CompanyID);
    PRINT 'Index IX_Items_CompanyID created successfully.';
END
GO

PRINT 'Items table setup completed successfully.';
GO