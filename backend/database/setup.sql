-- FBR SaaS Database Setup Script

-- Create Database
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

-- Create Companies Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    CREATE TABLE Companies (
        CompanyID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Name NVARCHAR(100) NOT NULL,
        NTNNumber NVARCHAR(20) NOT NULL,
        Address NVARCHAR(255) NOT NULL,
        City NVARCHAR(50) NOT NULL,
        Province NVARCHAR(50) NOT NULL,
        ContactPerson NVARCHAR(100) NOT NULL,
        ContactEmail NVARCHAR(100) NOT NULL,
        ContactPhone NVARCHAR(20) NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table Companies created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Companies already exists.';
END
GO

-- Create Users Table
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
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Users created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Users already exists.';
END
GO

-- Create Invoices Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE Invoices (
        InvoiceID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        InvoiceNumber NVARCHAR(50) NOT NULL,
        InvoiceType NVARCHAR(20) NOT NULL,
        InvoiceDate DATE NOT NULL,
        SellerNTNCNIC NVARCHAR(20) NOT NULL,
        SellerBusinessName NVARCHAR(100) NOT NULL,
        SellerProvince NVARCHAR(50) NOT NULL,
        SellerAddress NVARCHAR(255) NOT NULL,
        BuyerNTNCNIC NVARCHAR(20) NOT NULL,
        BuyerBusinessName NVARCHAR(100) NOT NULL,
        BuyerProvince NVARCHAR(50) NOT NULL,
        BuyerAddress NVARCHAR(255) NOT NULL,
        BuyerRegistrationType NVARCHAR(20) NOT NULL,
        InvoiceRefNo NVARCHAR(50) NOT NULL,
        ScenarioID NVARCHAR(20) NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        TotalSalesTax DECIMAL(18, 2) NOT NULL,
        TotalFurtherTax DECIMAL(18, 2) NOT NULL,
        TotalDiscount DECIMAL(18, 2) NOT NULL,
        FBRInvoiceNumber NVARCHAR(50) NULL,
        FBRResponseStatus NVARCHAR(10) NULL,
        FBRResponseMessage NVARCHAR(255) NULL,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
    );
    PRINT 'Table Invoices created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Invoices already exists.';
END
GO

-- Create InvoiceItems Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceItems')
BEGIN
    CREATE TABLE InvoiceItems (
        ItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        InvoiceID UNIQUEIDENTIFIER NOT NULL,
        HSCode NVARCHAR(20) NOT NULL,
        ProductDescription NVARCHAR(255) NOT NULL,
        Rate NVARCHAR(20) NOT NULL,
        UoM NVARCHAR(20) NOT NULL,
        Quantity DECIMAL(18, 2) NOT NULL,
        TotalValues DECIMAL(18, 2) NOT NULL,
        ValueSalesExcludingST DECIMAL(18, 2) NOT NULL,
        FixedNotifiedValueOrRetailPrice DECIMAL(18, 2) NOT NULL,
        SalesTaxApplicable DECIMAL(18, 2) NOT NULL,
        SalesTaxWithheldAtSource DECIMAL(18, 2) NOT NULL,
        ExtraTax DECIMAL(18, 2) NOT NULL,
        FurtherTax DECIMAL(18, 2) NOT NULL,
        SROScheduleNo NVARCHAR(50) NULL,
        FEDPayable DECIMAL(18, 2) NOT NULL,
        Discount DECIMAL(18, 2) NOT NULL,
        SaleType NVARCHAR(50) NOT NULL,
        SROItemSerialNo NVARCHAR(50) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
    );
    PRINT 'Table InvoiceItems created successfully.';
END
ELSE
BEGIN
    PRINT 'Table InvoiceItems already exists.';
END
GO

-- Create Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        Buyer_NTNCNIC NVARCHAR(20) NOT NULL,
        Buyer_Business_Name NVARCHAR(100) NOT NULL,
        Buyer_Province NVARCHAR(50) NOT NULL,
        Buyer_Address NVARCHAR(255) NOT NULL,
        Buyer_RegistrationType NVARCHAR(20) NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table Customers created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Customers already exists.';
END
GO

-- Create Inventory Table
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
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        UNIQUE(CompanyID, ProductCode)
    );
    PRINT 'Table Inventory created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Inventory already exists.';
END
GO

-- Create FBRApiTokens Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FBRApiTokens')
BEGIN
    CREATE TABLE FBRApiTokens (
        TokenID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyID UNIQUEIDENTIFIER NOT NULL,
        TokenValue NVARCHAR(255) NOT NULL,
        Environment NVARCHAR(20) NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
    PRINT 'Table FBRApiTokens created successfully.';
END
ELSE
BEGIN
    PRINT 'Table FBRApiTokens already exists.';
END
GO

-- Database setup completed - no sample data inserted

PRINT 'Database setup completed successfully.';
GO