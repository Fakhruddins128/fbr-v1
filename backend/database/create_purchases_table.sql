-- Create Purchases table for FBR SaaS application

USE FBR_SaaS;
GO

-- Create Purchases Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Purchases')
BEGIN
    CREATE TABLE Purchases (
        PurchaseID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        PONumber NVARCHAR(50) NULL,
        PODate DATE NULL,
        CRNumber NVARCHAR(50) NULL,
        Date DATE NULL,
        VendorID UNIQUEIDENTIFIER NOT NULL,
        VendorName NVARCHAR(255) NOT NULL,  -- Vendor name for the purchase
        TotalAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CreatedBy UNIQUEIDENTIFIER NULL,
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Purchases created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Purchases already exists.';
END
GO

-- Create PurchaseItems Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseItems')
BEGIN
    CREATE TABLE PurchaseItems (
        PurchaseItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PurchaseID UNIQUEIDENTIFIER NOT NULL,
        ItemID NVARCHAR(50) NOT NULL,
        ItemName NVARCHAR(255) NOT NULL,
        PurchasePrice DECIMAL(18, 2) NOT NULL,
        PurchaseQty DECIMAL(18, 2) NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (PurchaseID) REFERENCES Purchases(PurchaseID)
    );
    PRINT 'Table PurchaseItems created successfully.';
END
ELSE
BEGIN
    PRINT 'Table PurchaseItems already exists.';
END
GO

-- Create Vendors Table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vendors')
BEGIN
    CREATE TABLE Vendors (
        VendorID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        VendorName NVARCHAR(255) NOT NULL,
        ContactPersonName NVARCHAR(255) NULL,
        VendorCNIC NVARCHAR(15) NULL,
        Address NVARCHAR(500) NULL,
        Phone NVARCHAR(20) NULL,
        Email NVARCHAR(100) NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Vendors created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Vendors already exists.';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_CompanyID')
BEGIN
    CREATE INDEX IX_Purchases_CompanyID ON Purchases(CompanyID);
    PRINT 'Index IX_Purchases_CompanyID created successfully.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_VendorID')
BEGIN
    CREATE INDEX IX_Purchases_VendorID ON Purchases(VendorID);
    PRINT 'Index IX_Purchases_VendorID created successfully.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PurchaseItems_PurchaseID')
BEGIN
    CREATE INDEX IX_PurchaseItems_PurchaseID ON PurchaseItems(PurchaseID);
    PRINT 'Index IX_PurchaseItems_PurchaseID created successfully.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vendors_CompanyID')
BEGIN
    CREATE INDEX IX_Vendors_CompanyID ON Vendors(CompanyID);
    PRINT 'Index IX_Vendors_CompanyID created successfully.';
END
GO

PRINT 'Purchases table setup completed successfully.';
GO