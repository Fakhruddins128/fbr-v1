USE [FBR_SaaS];
GO

/* -------------------------------------------------------------------------- */
/* Companies                                                                   */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Companies', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Companies', 'CNIC') IS NULL
        ALTER TABLE Companies ADD CNIC NVARCHAR(20) NULL;

    IF COL_LENGTH('Companies', 'BusinessNameForSalesInvoice') IS NULL
        ALTER TABLE Companies ADD BusinessNameForSalesInvoice NVARCHAR(255) NULL;

    IF COL_LENGTH('Companies', 'BusinessActivity') IS NULL
        ALTER TABLE Companies ADD BusinessActivity NVARCHAR(MAX) NULL;

    IF COL_LENGTH('Companies', 'Sector') IS NULL
        ALTER TABLE Companies ADD Sector NVARCHAR(MAX) NULL;

    IF COL_LENGTH('Companies', 'FBRToken') IS NULL
        ALTER TABLE Companies ADD FBRToken NVARCHAR(500) NULL;
END
GO

IF OBJECT_ID('Companies', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_CNIC')
BEGIN
    CREATE INDEX IX_Companies_CNIC ON Companies(CNIC);
END
GO

IF OBJECT_ID('Companies', 'U') IS NOT NULL
AND COL_LENGTH('Companies', 'BusinessActivity') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Companies_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Companies
    ADD CONSTRAINT CK_Companies_BusinessActivity_JSON
    CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF OBJECT_ID('Companies', 'U') IS NOT NULL
AND COL_LENGTH('Companies', 'Sector') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Companies_Sector_JSON')
BEGIN
    ALTER TABLE Companies
    ADD CONSTRAINT CK_Companies_Sector_JSON
    CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

/* -------------------------------------------------------------------------- */
/* Customers                                                                   */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Customers', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Customers', 'Buyer_RegistrationNo') IS NULL
        ALTER TABLE Customers ADD Buyer_RegistrationNo NVARCHAR(50) NULL;

    IF COL_LENGTH('Customers', 'Buyer_Email') IS NULL
        ALTER TABLE Customers ADD Buyer_Email NVARCHAR(100) NULL;

    IF COL_LENGTH('Customers', 'Buyer_Cellphone') IS NULL
        ALTER TABLE Customers ADD Buyer_Cellphone NVARCHAR(20) NULL;

    IF COL_LENGTH('Customers', 'ContactPersonName') IS NULL
        ALTER TABLE Customers ADD ContactPersonName NVARCHAR(255) NULL;

    IF COL_LENGTH('Customers', 'BusinessActivity') IS NULL
        ALTER TABLE Customers ADD BusinessActivity NVARCHAR(MAX) NULL;

    IF COL_LENGTH('Customers', 'Sector') IS NULL
        ALTER TABLE Customers ADD Sector NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('Customers', 'U') IS NOT NULL
AND COL_LENGTH('Customers', 'BusinessActivity') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Customers_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Customers
    ADD CONSTRAINT CK_Customers_BusinessActivity_JSON
    CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF OBJECT_ID('Customers', 'U') IS NOT NULL
AND COL_LENGTH('Customers', 'Sector') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Customers_Sector_JSON')
BEGIN
    ALTER TABLE Customers
    ADD CONSTRAINT CK_Customers_Sector_JSON
    CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

/* -------------------------------------------------------------------------- */
/* Vendors                                                                     */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Vendors', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Vendors', 'VendorNTN') IS NULL
        ALTER TABLE Vendors ADD VendorNTN NVARCHAR(50) NULL;

    IF COL_LENGTH('Vendors', 'VendorCNIC') IS NULL
        ALTER TABLE Vendors ADD VendorCNIC NVARCHAR(15) NULL;

    IF COL_LENGTH('Vendors', 'ContactPersonName') IS NULL
        ALTER TABLE Vendors ADD ContactPersonName NVARCHAR(255) NULL;

    IF COL_LENGTH('Vendors', 'VendorAddress') IS NULL
        ALTER TABLE Vendors ADD VendorAddress NVARCHAR(500) NULL;

    IF COL_LENGTH('Vendors', 'VendorPhone') IS NULL
        ALTER TABLE Vendors ADD VendorPhone NVARCHAR(20) NULL;

    IF COL_LENGTH('Vendors', 'VendorEmail') IS NULL
        ALTER TABLE Vendors ADD VendorEmail NVARCHAR(255) NULL;

    IF COL_LENGTH('Vendors', 'BusinessActivity') IS NULL
        ALTER TABLE Vendors ADD BusinessActivity NVARCHAR(MAX) NULL;

    IF COL_LENGTH('Vendors', 'Sector') IS NULL
        ALTER TABLE Vendors ADD Sector NVARCHAR(MAX) NULL;

    IF COL_LENGTH('Vendors', 'VendorAddress') IS NOT NULL
       AND COL_LENGTH('Vendors', 'Address') IS NOT NULL
        EXEC('UPDATE Vendors SET VendorAddress = Address WHERE VendorAddress IS NULL');

    IF COL_LENGTH('Vendors', 'VendorPhone') IS NOT NULL
       AND COL_LENGTH('Vendors', 'Phone') IS NOT NULL
        EXEC('UPDATE Vendors SET VendorPhone = Phone WHERE VendorPhone IS NULL');

    IF COL_LENGTH('Vendors', 'VendorEmail') IS NOT NULL
       AND COL_LENGTH('Vendors', 'Email') IS NOT NULL
        EXEC('UPDATE Vendors SET VendorEmail = Email WHERE VendorEmail IS NULL');
END
GO

IF OBJECT_ID('Vendors', 'U') IS NOT NULL
AND COL_LENGTH('Vendors', 'BusinessActivity') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Vendors_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Vendors
    ADD CONSTRAINT CK_Vendors_BusinessActivity_JSON
    CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
END
GO

IF OBJECT_ID('Vendors', 'U') IS NOT NULL
AND COL_LENGTH('Vendors', 'Sector') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Vendors_Sector_JSON')
BEGIN
    ALTER TABLE Vendors
    ADD CONSTRAINT CK_Vendors_Sector_JSON
    CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
END
GO

IF OBJECT_ID('Vendors', 'U') IS NOT NULL
AND COL_LENGTH('Vendors', 'ContactPersonName') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Vendors_ContactPersonName')
BEGIN
    CREATE INDEX IX_Vendors_ContactPersonName ON Vendors(ContactPersonName);
END
GO

/* -------------------------------------------------------------------------- */
/* Items                                                                       */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Items', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Items', 'UoM') IS NULL
        ALTER TABLE Items ADD UoM NVARCHAR(50) NULL;

    IF COL_LENGTH('Items', 'InitialStock') IS NULL
        ALTER TABLE Items ADD InitialStock DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;
END
GO

IF EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Items'
      AND COLUMN_NAME = 'UoM'
      AND CHARACTER_MAXIMUM_LENGTH = 20
)
BEGIN
    ALTER TABLE Items ALTER COLUMN UoM NVARCHAR(50) NOT NULL;
END
GO

IF OBJECT_ID('Items', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Items_CompanyID')
BEGIN
    CREATE INDEX IX_Items_CompanyID ON Items(CompanyID);
END
GO

/* -------------------------------------------------------------------------- */
/* Purchases                                                                   */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Purchases', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Purchases', 'CRNumber') IS NULL
        ALTER TABLE Purchases ADD CRNumber NVARCHAR(50) NULL;

    IF COL_LENGTH('Purchases', 'Date') IS NULL
        ALTER TABLE Purchases ADD [Date] DATE NULL;
END
GO

IF OBJECT_ID('Purchases', 'U') IS NOT NULL
AND COL_LENGTH('Purchases', 'CRNumber') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Purchases_CRNumber')
BEGIN
    CREATE INDEX IX_Purchases_CRNumber ON Purchases(CRNumber);
END
GO

IF OBJECT_ID('Purchases', 'U') IS NOT NULL
AND COL_LENGTH('Purchases', 'Date') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Purchases_Date')
BEGIN
    CREATE INDEX IX_Purchases_Date ON Purchases([Date]);
END
GO

IF OBJECT_ID('Purchases', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Purchases_CompanyID')
BEGIN
    CREATE INDEX IX_Purchases_CompanyID ON Purchases(CompanyID);
END
GO

IF OBJECT_ID('PurchaseItems', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PurchaseItems_PurchaseID')
BEGIN
    CREATE INDEX IX_PurchaseItems_PurchaseID ON PurchaseItems(PurchaseID);
END
GO

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('Invoices', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Invoices', 'InvoiceRefNo') IS NULL
        ALTER TABLE Invoices ADD InvoiceRefNo NVARCHAR(50) NULL;

    IF COL_LENGTH('Invoices', 'PONumber') IS NULL
        ALTER TABLE Invoices ADD PONumber NVARCHAR(50) NULL;

    IF COL_LENGTH('Invoices', 'ScenarioID') IS NULL
    BEGIN
        ALTER TABLE Invoices ADD ScenarioID NVARCHAR(50) NULL;
        UPDATE Invoices SET ScenarioID = 'SCENARIO_001' WHERE ScenarioID IS NULL;
    END

    IF COL_LENGTH('Invoices', 'TotalAmount') IS NULL
        ALTER TABLE Invoices ADD TotalAmount DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('Invoices', 'TotalSalesTax') IS NULL
        ALTER TABLE Invoices ADD TotalSalesTax DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('Invoices', 'TotalFurtherTax') IS NULL
        ALTER TABLE Invoices ADD TotalFurtherTax DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('Invoices', 'TotalDiscount') IS NULL
        ALTER TABLE Invoices ADD TotalDiscount DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('Invoices', 'FBRInvoiceNumber') IS NULL
        ALTER TABLE Invoices ADD FBRInvoiceNumber NVARCHAR(50) NULL;

    IF COL_LENGTH('Invoices', 'FBRResponseStatus') IS NULL
        ALTER TABLE Invoices ADD FBRResponseStatus NVARCHAR(10) NULL;

    IF COL_LENGTH('Invoices', 'FBRResponseMessage') IS NULL
        ALTER TABLE Invoices ADD FBRResponseMessage NVARCHAR(255) NULL;

    IF COL_LENGTH('Invoices', 'UpdatedAt') IS NULL
        ALTER TABLE Invoices ADD UpdatedAt DATETIME NOT NULL DEFAULT (GETDATE()) WITH VALUES;
END
GO

IF OBJECT_ID('Invoices', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Invoices_CompanyID')
BEGIN
    CREATE INDEX IX_Invoices_CompanyID ON Invoices(CompanyID);
END
GO

/* -------------------------------------------------------------------------- */
/* InvoiceItems                                                                */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('InvoiceItems', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('InvoiceItems', 'MasterItemID') IS NULL
        ALTER TABLE InvoiceItems ADD MasterItemID UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('InvoiceItems', 'FixedNotifiedValueOrRetailPrice') IS NULL
        ALTER TABLE InvoiceItems ADD FixedNotifiedValueOrRetailPrice DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'SalesTaxWithheldAtSource') IS NULL
        ALTER TABLE InvoiceItems ADD SalesTaxWithheldAtSource DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'ExtraTax') IS NULL
        ALTER TABLE InvoiceItems ADD ExtraTax DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'FurtherTax') IS NULL
        ALTER TABLE InvoiceItems ADD FurtherTax DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'SROScheduleNo') IS NULL
        ALTER TABLE InvoiceItems ADD SROScheduleNo NVARCHAR(50) NULL;

    IF COL_LENGTH('InvoiceItems', 'FEDPayable') IS NULL
        ALTER TABLE InvoiceItems ADD FEDPayable DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'Discount') IS NULL
        ALTER TABLE InvoiceItems ADD Discount DECIMAL(18, 2) NOT NULL DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('InvoiceItems', 'SaleType') IS NULL
        ALTER TABLE InvoiceItems ADD SaleType NVARCHAR(50) NULL;

    IF COL_LENGTH('InvoiceItems', 'SROItemSerialNo') IS NULL
        ALTER TABLE InvoiceItems ADD SROItemSerialNo NVARCHAR(50) NULL;

    IF COL_LENGTH('InvoiceItems', 'UpdatedAt') IS NULL
        ALTER TABLE InvoiceItems ADD UpdatedAt DATETIME NOT NULL DEFAULT (GETDATE()) WITH VALUES;
END
GO

IF OBJECT_ID('InvoiceItems', 'U') IS NOT NULL
AND OBJECT_ID('Items', 'U') IS NOT NULL
AND COL_LENGTH('InvoiceItems', 'MasterItemID') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_InvoiceItems_MasterItem')
BEGIN
    ALTER TABLE InvoiceItems
    ADD CONSTRAINT FK_InvoiceItems_MasterItem
    FOREIGN KEY (MasterItemID) REFERENCES Items(ItemID);
END
GO

/* -------------------------------------------------------------------------- */
/* Missing tables hint                                                         */
/* -------------------------------------------------------------------------- */
IF OBJECT_ID('ScenarioMapping', 'U') IS NULL
    PRINT 'WARNING: ScenarioMapping table is missing. Run setup100526.sql.';
IF OBJECT_ID('Inventory', 'U') IS NULL
    PRINT 'WARNING: Inventory table is missing. Run setup100526.sql.';
IF OBJECT_ID('Purchases', 'U') IS NULL
    PRINT 'WARNING: Purchases table is missing. Run setup100526.sql.';
IF OBJECT_ID('PurchaseItems', 'U') IS NULL
    PRINT 'WARNING: PurchaseItems table is missing. Run setup100526.sql.';
IF OBJECT_ID('Invoices', 'U') IS NULL
    PRINT 'WARNING: Invoices table is missing. Run setup100526.sql.';
IF OBJECT_ID('InvoiceItems', 'U') IS NULL
    PRINT 'WARNING: InvoiceItems table is missing. Run setup100526.sql.';
GO