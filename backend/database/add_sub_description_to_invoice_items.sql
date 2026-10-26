-- Migration: add optional per-line Sub-Description to sales invoice lines
--
-- Feature 001-invoice-sub-description.
--
-- One Item Master product can be invoiced with line-specific variations
-- ("Ink Roll" + "Size 30mm") without duplicating the catalogue record. The
-- variation is stored here, separately from ProductDescription.
--
-- IMPORTANT: ProductDescription must continue to hold the catalogue product
-- name alone. Stock is derived by matching InvoiceItems to Items on HSCode and
-- ProductDescription, so storing a merged "Ink Roll - Size 30mm" there would
-- silently stop sold quantities from being counted and overstate stock.
-- The merged description is produced at display and submission time only.
--
-- Safe to run more than once.

USE FBR_SaaS;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'SubDescription'
)
BEGIN
    ALTER TABLE InvoiceItems ADD SubDescription NVARCHAR(255) NULL;
    PRINT 'Column InvoiceItems.SubDescription added successfully.';
END
ELSE
BEGIN
    PRINT 'Column InvoiceItems.SubDescription already exists.';
END
GO

-- No backfill. Existing rows keep NULL, which reads as "no variation"
-- everywhere, so historical invoices are unaffected.

-- Rollback (destroys captured variations, restores prior behaviour exactly):
--   ALTER TABLE InvoiceItems DROP COLUMN SubDescription;
