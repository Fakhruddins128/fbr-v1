USE FBR_SaaS;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'AdvanceTaxRate')
BEGIN
    ALTER TABLE InvoiceItems ADD AdvanceTaxRate DECIMAL(18, 4) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'AdvanceTaxValue')
BEGIN
    ALTER TABLE InvoiceItems ADD AdvanceTaxValue DECIMAL(18, 2) NOT NULL DEFAULT 0;
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'AdvanceTaxRate')
BEGIN
    UPDATE InvoiceItems SET AdvanceTaxRate = 0 WHERE AdvanceTaxRate IS NULL;
END
GO
