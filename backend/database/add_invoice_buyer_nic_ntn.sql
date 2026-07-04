IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'Buyer_NIC')
BEGIN
    ALTER TABLE Invoices
    ADD Buyer_NIC NVARCHAR(20) NULL;
    PRINT 'Added Buyer_NIC column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'Buyer_NIC column already exists in Invoices table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'Buyer_NTN')
BEGIN
    ALTER TABLE Invoices
    ADD Buyer_NTN NVARCHAR(50) NULL;
    PRINT 'Added Buyer_NTN column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'Buyer_NTN column already exists in Invoices table.';
END
GO
