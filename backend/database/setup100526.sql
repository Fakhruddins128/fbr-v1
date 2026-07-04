-- FBR SaaS Database Setup Script (Up-to-date)

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FBR_SaaS')
BEGIN
    CREATE DATABASE FBR_SaaS;
    PRINT 'Database FBR_SaaS created successfully.';
END
ELSE
BEGIN
    PRINT 'Database FBR_SaaS already exists.';
END
GO

USE FBR_SaaS;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    CREATE TABLE Companies (
        CompanyID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Name NVARCHAR(100) NOT NULL,
        NTNNumber NVARCHAR(20) NOT NULL,
        CNIC NVARCHAR(20) NULL,
        BusinessNameForSalesInvoice NVARCHAR(255) NULL,
        SalesInvoiceTemplate NVARCHAR(50) NOT NULL DEFAULT 'template1',
        Address NVARCHAR(255) NOT NULL,
        City NVARCHAR(50) NOT NULL,
        Province NVARCHAR(50) NOT NULL,
        ContactPerson NVARCHAR(100) NOT NULL,
        ContactEmail NVARCHAR(100) NOT NULL,
        ContactPhone NVARCHAR(20) NOT NULL,
        BusinessActivity NVARCHAR(MAX) NULL,
        Sector NVARCHAR(MAX) NULL,
        FBRToken NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Companies created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Companies already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'CNIC')
    ALTER TABLE Companies ADD CNIC NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'BusinessNameForSalesInvoice')
    ALTER TABLE Companies ADD BusinessNameForSalesInvoice NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'SalesInvoiceTemplate')
    ALTER TABLE Companies ADD SalesInvoiceTemplate NVARCHAR(50) NOT NULL DEFAULT 'template1';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'BusinessActivity')
    ALTER TABLE Companies ADD BusinessActivity NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'Sector')
    ALTER TABLE Companies ADD Sector NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'FBRToken')
    ALTER TABLE Companies ADD FBRToken NVARCHAR(500) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Companies_CNIC')
BEGIN
    CREATE INDEX IX_Companies_CNIC ON Companies(CNIC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Companies_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Companies ADD CONSTRAINT CK_Companies_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Companies_Sector_JSON')
BEGIN
    ALTER TABLE Companies ADD CONSTRAINT CK_Companies_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NULL,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        FirstName NVARCHAR(50) NOT NULL,
        LastName NVARCHAR(50) NOT NULL,
        Role NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Users_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Users created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Users already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScenarioMapping')
BEGIN
    CREATE TABLE ScenarioMapping (
        id INT PRIMARY KEY IDENTITY(1,1),
        business_activity NVARCHAR(100) NOT NULL,
        sector NVARCHAR(100) NOT NULL,
        applicable_scenarios NVARCHAR(MAX) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ScenarioMapping_BusinessActivity_Sector')
BEGIN
    CREATE INDEX IX_ScenarioMapping_BusinessActivity_Sector 
    ON ScenarioMapping (business_activity, sector);
END
GO

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_ScenarioMapping_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_ScenarioMapping_UpdatedAt
    ON ScenarioMapping
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE ScenarioMapping
        SET updated_at = GETDATE()
        FROM ScenarioMapping sm
        INNER JOIN inserted i ON sm.id = i.id;
    END
    ');
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        Buyer_NTNCNIC NVARCHAR(20) NOT NULL,
        Buyer_NIC NVARCHAR(20) NULL,
        Buyer_NTN NVARCHAR(50) NULL,
        Buyer_Business_Name NVARCHAR(100) NOT NULL,
        Buyer_Province NVARCHAR(50) NOT NULL,
        Buyer_Address NVARCHAR(255) NOT NULL,
        Buyer_RegistrationType NVARCHAR(20) NOT NULL,
        Buyer_RegistrationNo NVARCHAR(50) NULL,
        Buyer_Email NVARCHAR(100) NULL,
        Buyer_Cellphone NVARCHAR(20) NULL,
        ContactPersonName NVARCHAR(255) NULL,
        BusinessActivity NVARCHAR(MAX) NULL,
        Sector NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Customers_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Customers created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Customers already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_NIC')
    ALTER TABLE Customers ADD Buyer_NIC NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_NTN')
    ALTER TABLE Customers ADD Buyer_NTN NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_RegistrationNo')
    ALTER TABLE Customers ADD Buyer_RegistrationNo NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_Email')
    ALTER TABLE Customers ADD Buyer_Email NVARCHAR(100) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_Cellphone')
    ALTER TABLE Customers ADD Buyer_Cellphone NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'ContactPersonName')
    ALTER TABLE Customers ADD ContactPersonName NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'BusinessActivity')
    ALTER TABLE Customers ADD BusinessActivity NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Sector')
    ALTER TABLE Customers ADD Sector NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Customers_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT CK_Customers_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Customers_Sector_JSON')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT CK_Customers_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vendors')
BEGIN
    CREATE TABLE Vendors (
        VendorID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        VendorName NVARCHAR(255) NOT NULL,
        VendorNTN NVARCHAR(50) NOT NULL,
        VendorCNIC NVARCHAR(15) NULL,
        ContactPersonName NVARCHAR(255) NULL,
        VendorAddress NVARCHAR(500) NOT NULL,
        VendorPhone NVARCHAR(20) NOT NULL,
        VendorEmail NVARCHAR(255) NOT NULL,
        BusinessActivity NVARCHAR(MAX) NULL,
        Sector NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Vendors_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        CONSTRAINT FK_Vendors_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
    );
    PRINT 'Table Vendors created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Vendors already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorNTN')
    ALTER TABLE Vendors ADD VendorNTN NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorCNIC')
    ALTER TABLE Vendors ADD VendorCNIC NVARCHAR(15) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'ContactPersonName')
    ALTER TABLE Vendors ADD ContactPersonName NVARCHAR(255) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorAddress')
BEGIN
    ALTER TABLE Vendors ADD VendorAddress NVARCHAR(500) NULL;
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Address')
        EXEC('UPDATE Vendors SET VendorAddress = Address WHERE VendorAddress IS NULL');
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorPhone')
BEGIN
    ALTER TABLE Vendors ADD VendorPhone NVARCHAR(20) NULL;
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Phone')
        EXEC('UPDATE Vendors SET VendorPhone = Phone WHERE VendorPhone IS NULL');
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'VendorEmail')
BEGIN
    ALTER TABLE Vendors ADD VendorEmail NVARCHAR(255) NULL;
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Email')
        EXEC('UPDATE Vendors SET VendorEmail = Email WHERE VendorEmail IS NULL');
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'BusinessActivity')
    ALTER TABLE Vendors ADD BusinessActivity NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Sector')
    ALTER TABLE Vendors ADD Sector NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Vendors_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Vendors ADD CONSTRAINT CK_Vendors_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Vendors_Sector_JSON')
BEGIN
    ALTER TABLE Vendors ADD CONSTRAINT CK_Vendors_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Items')
BEGIN
    CREATE TABLE Items (
        ItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        HSCode NVARCHAR(50) NOT NULL,
        Description NTEXT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        PurchaseTaxValue DECIMAL(5, 2) NOT NULL DEFAULT 0,
        SalesTaxValue DECIMAL(5, 2) NOT NULL DEFAULT 0,
        UoM NVARCHAR(50) NOT NULL DEFAULT 'Numbers, pieces, units',
        InitialStock DECIMAL(18, 2) NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        ItemCreateDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Items_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        CONSTRAINT FK_Items_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
    );
    PRINT 'Table Items created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Items already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Items') AND name = 'UoM')
    ALTER TABLE Items ADD UoM NVARCHAR(50) NULL;
GO

IF EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Items' 
    AND COLUMN_NAME = 'UoM'
    AND CHARACTER_MAXIMUM_LENGTH = 20
)
BEGIN
    ALTER TABLE Items ALTER COLUMN UoM NVARCHAR(50) NOT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Items') AND name = 'InitialStock')
BEGIN
    ALTER TABLE Items ADD InitialStock DECIMAL(18, 2) NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Items_CompanyID')
BEGIN
    CREATE INDEX IX_Items_CompanyID ON Items(CompanyID);
END
GO

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
        VendorName NVARCHAR(255) NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CreatedBy UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Purchases_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        CONSTRAINT FK_Purchases_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
        CONSTRAINT FK_Purchases_Vendors FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID)
    );
    PRINT 'Table Purchases created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Purchases already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Purchases') AND name = 'CRNumber')
    ALTER TABLE Purchases ADD CRNumber NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Purchases') AND name = 'Date')
    ALTER TABLE Purchases ADD Date DATE NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_CRNumber')
BEGIN
    CREATE INDEX IX_Purchases_CRNumber ON Purchases(CRNumber);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_Date')
BEGIN
    CREATE INDEX IX_Purchases_Date ON Purchases(Date);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Purchases_CompanyID')
BEGIN
    CREATE INDEX IX_Purchases_CompanyID ON Purchases(CompanyID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseItems')
BEGIN
    CREATE TABLE PurchaseItems (
        PurchaseItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PurchaseID UNIQUEIDENTIFIER NOT NULL,
        ItemID UNIQUEIDENTIFIER NOT NULL,
        ItemName NVARCHAR(255) NOT NULL,
        PurchasePrice DECIMAL(18, 2) NOT NULL,
        PurchaseQty DECIMAL(18, 2) NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_PurchaseItems_Purchases FOREIGN KEY (PurchaseID) REFERENCES Purchases(PurchaseID),
        CONSTRAINT FK_PurchaseItems_Items FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
    );
    PRINT 'Table PurchaseItems created successfully.';
END
ELSE
BEGIN
    PRINT 'Table PurchaseItems already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PurchaseItems_PurchaseID')
BEGIN
    CREATE INDEX IX_PurchaseItems_PurchaseID ON PurchaseItems(PurchaseID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inventory')
BEGIN
    CREATE TABLE Inventory (
        InventoryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        ProductCode NVARCHAR(50) NOT NULL,
        ProductName NVARCHAR(255) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        CurrentStock INT NOT NULL DEFAULT 0,
        MinStock INT NOT NULL DEFAULT 0,
        UnitPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
        TotalValue AS (CurrentStock * UnitPrice) PERSISTED,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Inventory_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        CONSTRAINT UQ_Inventory_Company_ProductCode UNIQUE(CompanyID, ProductCode)
    );
    PRINT 'Table Inventory created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Inventory already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FBRApiTokens')
BEGIN
    CREATE TABLE FBRApiTokens (
        TokenID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        TokenValue NVARCHAR(255) NOT NULL,
        Environment NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_FBRApiTokens_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table FBRApiTokens created successfully.';
END
ELSE
BEGIN
    PRINT 'Table FBRApiTokens already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE Invoices (
        InvoiceID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        InvoiceNumber NVARCHAR(50) NOT NULL,
        InvoiceType NVARCHAR(50) NOT NULL,
        InvoiceDate DATETIME NOT NULL,
        SellerNTNCNIC NVARCHAR(20) NOT NULL,
        SellerBusinessName NVARCHAR(255) NOT NULL,
        SellerProvince NVARCHAR(50) NOT NULL,
        SellerAddress NVARCHAR(255) NOT NULL,
        BuyerNTNCNIC NVARCHAR(20) NOT NULL,
        Buyer_NIC NVARCHAR(20) NULL,
        Buyer_NTN NVARCHAR(50) NULL,
        BuyerBusinessName NVARCHAR(255) NOT NULL,
        BuyerProvince NVARCHAR(50) NOT NULL,
        BuyerAddress NVARCHAR(255) NOT NULL,
        BuyerRegistrationType NVARCHAR(50) NOT NULL,
        InvoiceRefNo NVARCHAR(50) NULL,
        PONumber NVARCHAR(50) NULL,
        ScenarioID NVARCHAR(50) NOT NULL DEFAULT 'SCENARIO_001',
        TotalAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        TotalSalesTax DECIMAL(18, 2) NOT NULL DEFAULT 0,
        TotalFurtherTax DECIMAL(18, 2) NOT NULL DEFAULT 0,
        TotalDiscount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        FBRInvoiceNumber NVARCHAR(50) NULL,
        FBRResponseStatus NVARCHAR(10) NULL,
        FBRResponseMessage NVARCHAR(255) NULL,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Invoices_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        CONSTRAINT FK_Invoices_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
    );
    PRINT 'Table Invoices created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Invoices already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'Buyer_NIC')
    ALTER TABLE Invoices ADD Buyer_NIC NVARCHAR(20) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'Buyer_NTN')
    ALTER TABLE Invoices ADD Buyer_NTN NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_CompanyID')
BEGIN
    CREATE INDEX IX_Invoices_CompanyID ON Invoices(CompanyID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceItems')
BEGIN
    CREATE TABLE InvoiceItems (
        ItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        InvoiceID UNIQUEIDENTIFIER NOT NULL,
        MasterItemID UNIQUEIDENTIFIER NULL,
        HSCode NVARCHAR(50) NOT NULL,
        ProductDescription NVARCHAR(255) NOT NULL,
        Rate NVARCHAR(20) NOT NULL,
        UoM NVARCHAR(50) NOT NULL,
        Quantity DECIMAL(18, 4) NOT NULL,
        TotalValues DECIMAL(18, 2) NOT NULL DEFAULT 0,
        ValueSalesExcludingST DECIMAL(18, 2) NOT NULL DEFAULT 0,
        FixedNotifiedValueOrRetailPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
        SalesTaxApplicable DECIMAL(18, 2) NOT NULL DEFAULT 0,
        SalesTaxWithheldAtSource DECIMAL(18, 2) NOT NULL DEFAULT 0,
        ExtraTax DECIMAL(18, 2) NOT NULL DEFAULT 0,
        FurtherTax DECIMAL(18, 2) NOT NULL DEFAULT 0,
        SROScheduleNo NVARCHAR(50) NULL,
        FEDPayable DECIMAL(18, 2) NOT NULL DEFAULT 0,
        Discount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        SaleType NVARCHAR(50) NOT NULL DEFAULT '',
        SROItemSerialNo NVARCHAR(50) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InvoiceItems_Invoices FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
    );
    PRINT 'Table InvoiceItems created successfully.';
END
ELSE
BEGIN
    PRINT 'Table InvoiceItems already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'MasterItemID')
BEGIN
    ALTER TABLE InvoiceItems ADD MasterItemID UNIQUEIDENTIFIER NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InvoiceItems_MasterItem')
BEGIN
    ALTER TABLE InvoiceItems
    ADD CONSTRAINT FK_InvoiceItems_MasterItem 
    FOREIGN KEY (MasterItemID) REFERENCES Items(ItemID);
END
GO

IF OBJECT_ID('Sales', 'V') IS NULL AND OBJECT_ID('Sales', 'U') IS NULL
BEGIN
    EXEC('
        CREATE VIEW Sales AS
        SELECT
            InvoiceID AS SaleID,
            CompanyID,
            InvoiceDate,
            InvoiceNumber,
            BuyerBusinessName AS CustomerName,
            TotalAmount,
            FBRInvoiceNumber
        FROM Invoices
    ');
END
GO

PRINT 'Database setup completed successfully.';
GO
