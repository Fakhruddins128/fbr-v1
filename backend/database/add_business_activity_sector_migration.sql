-- Migration script to add Business Activity and Sector fields to Companies, Customers, and Vendors tables
-- These fields support multiple values stored as JSON arrays

USE FBR_SaaS;
GO

-- Add BusinessActivity and Sector fields to Companies table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'BusinessActivity')
BEGIN
    ALTER TABLE Companies ADD BusinessActivity NVARCHAR(MAX) NULL;
    PRINT 'BusinessActivity column added to Companies table successfully.';
END
ELSE
BEGIN
    PRINT 'BusinessActivity column already exists in Companies table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Companies') AND name = 'Sector')
BEGIN
    ALTER TABLE Companies ADD Sector NVARCHAR(MAX) NULL;
    PRINT 'Sector column added to Companies table successfully.';
END
ELSE
BEGIN
    PRINT 'Sector column already exists in Companies table.';
END
GO

-- Add BusinessActivity and Sector fields to Customers table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'BusinessActivity')
BEGIN
    ALTER TABLE Customers ADD BusinessActivity NVARCHAR(MAX) NULL;
    PRINT 'BusinessActivity column added to Customers table successfully.';
END
ELSE
BEGIN
    PRINT 'BusinessActivity column already exists in Customers table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Sector')
BEGIN
    ALTER TABLE Customers ADD Sector NVARCHAR(MAX) NULL;
    PRINT 'Sector column added to Customers table successfully.';
END
ELSE
BEGIN
    PRINT 'Sector column already exists in Customers table.';
END
GO

-- Add BusinessActivity and Sector fields to Vendors table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'BusinessActivity')
BEGIN
    ALTER TABLE Vendors ADD BusinessActivity NVARCHAR(MAX) NULL;
    PRINT 'BusinessActivity column added to Vendors table successfully.';
END
ELSE
BEGIN
    PRINT 'BusinessActivity column already exists in Vendors table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vendors') AND name = 'Sector')
BEGIN
    ALTER TABLE Vendors ADD Sector NVARCHAR(MAX) NULL;
    PRINT 'Sector column added to Vendors table successfully.';
END
ELSE
BEGIN
    PRINT 'Sector column already exists in Vendors table.';
END
GO

-- Add check constraints to ensure valid JSON format (optional)
-- These constraints validate that the stored data is valid JSON
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Companies_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Companies ADD CONSTRAINT CK_Companies_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
    PRINT 'JSON validation constraint added for Companies.BusinessActivity.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Companies_Sector_JSON')
BEGIN
    ALTER TABLE Companies ADD CONSTRAINT CK_Companies_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
    PRINT 'JSON validation constraint added for Companies.Sector.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Customers_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT CK_Customers_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
    PRINT 'JSON validation constraint added for Customers.BusinessActivity.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Customers_Sector_JSON')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT CK_Customers_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
    PRINT 'JSON validation constraint added for Customers.Sector.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Vendors_BusinessActivity_JSON')
BEGIN
    ALTER TABLE Vendors ADD CONSTRAINT CK_Vendors_BusinessActivity_JSON 
        CHECK (BusinessActivity IS NULL OR ISJSON(BusinessActivity) = 1);
    PRINT 'JSON validation constraint added for Vendors.BusinessActivity.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Vendors_Sector_JSON')
BEGIN
    ALTER TABLE Vendors ADD CONSTRAINT CK_Vendors_Sector_JSON 
        CHECK (Sector IS NULL OR ISJSON(Sector) = 1);
    PRINT 'JSON validation constraint added for Vendors.Sector.';
END
GO

PRINT 'Business Activity and Sector migration completed successfully.';
GO