IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_NIC')
BEGIN
    ALTER TABLE Customers
    ADD Buyer_NIC NVARCHAR(20) NULL;
    PRINT 'Added Buyer_NIC column to Customers table.';
END
ELSE
BEGIN
    PRINT 'Buyer_NIC column already exists in Customers table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Buyer_NTN')
BEGIN
    ALTER TABLE Customers
    ADD Buyer_NTN NVARCHAR(50) NULL;
    PRINT 'Added Buyer_NTN column to Customers table.';
END
ELSE
BEGIN
    PRINT 'Buyer_NTN column already exists in Customers table.';
END
GO
