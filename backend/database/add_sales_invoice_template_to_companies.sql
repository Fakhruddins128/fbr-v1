USE FBR_SaaS;
GO

IF NOT EXISTS (
    SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Companies')
      AND name = 'SalesInvoiceTemplate'
)
BEGIN
    ALTER TABLE Companies
    ADD SalesInvoiceTemplate NVARCHAR(50) NOT NULL
        CONSTRAINT DF_Companies_SalesInvoiceTemplate DEFAULT 'template1';

    PRINT 'SalesInvoiceTemplate column added to Companies table successfully.';
END
ELSE
BEGIN
    PRINT 'SalesInvoiceTemplate column already exists in Companies table.';
END
GO

UPDATE Companies
SET SalesInvoiceTemplate = 'template1'
WHERE SalesInvoiceTemplate IS NULL
   OR LTRIM(RTRIM(SalesInvoiceTemplate)) = '';
GO

PRINT 'Migration completed: Sales invoice template added to Companies table.';
