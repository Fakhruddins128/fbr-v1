-- Migration: widen InvoiceItems.FurtherTaxRate to DECIMAL(18, 4)
--
-- Advance Tax and Further Tax became two-way pairs on the Sales Invoice Item
-- Detail panel: typing the percentage computes the amount, and typing the amount
-- back-solves the percentage. A back-solved percentage rarely lands on two
-- decimals -- 61 on a 12,000 line is 0.5083% -- and DECIMAL(5, 2) would round it
-- to 0.51, which recomputes the amount as 61.20 the next time the line is
-- touched.
--
-- AdvanceTaxRate has always been DECIMAL(18, 4). This brings FurtherTaxRate,
-- added 2026-11-18 as DECIMAL(5, 2), into line with it.
--
-- Only needed for a database that ran add_mrp_fields_to_invoice_items.sql
-- before 2026-11-25; that script now creates the column at DECIMAL(18, 4)
-- directly, and the two can be run in either order.
--
-- Widening a decimal in place rewrites no rows and loses no data. Safe to run
-- more than once.

USE FBR_SaaS;
GO

IF EXISTS (
    SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems')
      AND name = 'FurtherTaxRate'
      AND (scale < 4 OR precision < 18)
)
BEGIN
    ALTER TABLE InvoiceItems ALTER COLUMN FurtherTaxRate DECIMAL(18, 4) NULL;
    PRINT 'Column InvoiceItems.FurtherTaxRate widened to DECIMAL(18, 4).';
END
ELSE IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'FurtherTaxRate'
)
BEGIN
    PRINT 'Column InvoiceItems.FurtherTaxRate is already DECIMAL(18, 4) or wider.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.FurtherTaxRate does not exist yet. Run add_mrp_fields_to_invoice_items.sql.';
END
GO

-- Rollback (only safe if no stored rate uses more than 2 decimals, which this
-- change is what allows -- check before running):
--   ALTER TABLE InvoiceItems ALTER COLUMN FurtherTaxRate DECIMAL(5, 2) NULL;
