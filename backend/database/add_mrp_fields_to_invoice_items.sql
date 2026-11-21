-- Migration: MRP-mode pricing fields on sales invoice lines
--
-- Supports the Item Detail toggle added 2026-11-18. A line priced in MRP mode
-- is entered as retail price x quantity, less a discount; a line in normal mode
-- is entered as unit price x quantity.
--
-- Discount already exists on InvoiceItems and was previously always 0; it now
-- carries the real figure, so no new column is needed for it.
--
-- IsMrpMode is stored rather than inferred. Inferring it from "MrpPerItem > 0"
-- would misread a line whose retail price is legitimately zero, and the mode
-- decides which fields the form shows when the invoice is reopened.
--
-- Safe to run more than once.

USE FBR_SaaS;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'IsMrpMode'
)
BEGIN
    ALTER TABLE InvoiceItems ADD IsMrpMode BIT NOT NULL DEFAULT 0;
    PRINT 'Column InvoiceItems.IsMrpMode added successfully.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.IsMrpMode already exists.';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'MrpPerItem'
)
BEGIN
    ALTER TABLE InvoiceItems ADD MrpPerItem DECIMAL(18, 2) NULL;
    PRINT 'Column InvoiceItems.MrpPerItem added successfully.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.MrpPerItem already exists.';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'SalePricePerProduct'
)
BEGIN
    ALTER TABLE InvoiceItems ADD SalePricePerProduct DECIMAL(18, 2) NULL;
    PRINT 'Column InvoiceItems.SalePricePerProduct added successfully.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.SalePricePerProduct already exists.';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'FurtherTaxRate'
)
BEGIN
    ALTER TABLE InvoiceItems ADD FurtherTaxRate DECIMAL(5, 2) NULL;
    PRINT 'Column InvoiceItems.FurtherTaxRate added successfully.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.FurtherTaxRate already exists.';
END
GO

-- No backfill. Existing rows read as normal-mode lines with no retail price,
-- which is exactly how they were entered.

-- Rollback (discards MRP pricing detail; the line totals themselves are
-- unaffected because they live in ValueSalesExcludingST as before):
--   ALTER TABLE InvoiceItems DROP COLUMN IsMrpMode;
--   ALTER TABLE InvoiceItems DROP COLUMN MrpPerItem;
--   ALTER TABLE InvoiceItems DROP COLUMN SalePricePerProduct;
--   ALTER TABLE InvoiceItems DROP COLUMN FurtherTaxRate;
