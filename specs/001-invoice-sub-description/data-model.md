# Phase 1 Data Model: Optional Product Sub-Description

**Feature**: `001-invoice-sub-description`
**Date**: 2026-10-26
**Depends on**: [research.md](./research.md)

## Changed entity

### InvoiceItems (sales invoice line)

One new column. Nothing else on the table changes.

| Column | Type | Null | Notes |
|---|---|---|---|
| `SubDescription` | `NVARCHAR(255)` | YES | New. The line-specific variation, as typed. `NULL` on every pre-existing row and on any line where the user left it blank. |

Existing columns relevant to this feature, unchanged:

| Column | Type | Null | Why it matters here |
|---|---|---|---|
| `ProductDescription` | `NVARCHAR(255)` | NO | **Load-bearing.** Must continue to hold the catalogue product name verbatim — four stock matchers depend on it (research R2). Never receives the merged value. |
| `HSCode` | `NVARCHAR(50)` | NO | Half of the stock match key. Unchanged. |
| `MasterItemID` | `UNIQUEIDENTIFIER` | YES | Present on newer databases. Not used as the stock key today; noted as the eventual fix for R2. |

**Length**: 255 matches `ProductDescription`, so the column is consistent with its sibling. The binding constraint is not this column but the merged length the user is warned about (FR-017) — see Validation below.

**Null vs empty**: `NULL`, `''` and a whitespace-only string are all equivalent downstream. The API normalises whitespace-only input to `NULL` on write so storage does not accumulate three ways of saying "nothing".

---

## Derived value

### Merged description

Not stored. Computed wherever a line is shown or submitted.

```
merged(productName, subDescription) =
    subDescription has non-whitespace content
      ? productName + " - " + trim(subDescription)
      : productName
```

| productName | subDescription | merged |
|---|---|---|
| `Ink Roll` | `Size 30mm` | `Ink Roll - Size 30mm` |
| `Ink Roll` | `  Size 30mm  ` | `Ink Roll - Size 30mm` |
| `Ink Roll` | `` (empty) | `Ink Roll` |
| `Ink Roll` | `   ` (spaces) | `Ink Roll` |
| `Ink Roll` | `NULL` | `Ink Roll` |
| `Ink Roll` | `Size 30mm - Blue` | `Ink Roll - Size 30mm - Blue` |

The separator is not reserved: a sub-description containing ` - ` needs no escaping, because the value is never parsed back out.

---

## Validation rules

| Rule | Applies at | Source |
|---|---|---|
| `SubDescription` is optional; a line saves with it absent | Create, update | FR-002 |
| Whitespace-only is stored as `NULL` | Create, update | FR-007, FR-008 |
| Each line carries its own value; no cross-line inheritance | Create, update | FR-003 |
| `ProductDescription` continues to receive the catalogue name only | Create, update | FR-010, FR-011 |
| Merged length must not exceed `MAX_PRODUCT_DESCRIPTION_LENGTH` (default 255) | Before FBR submission, surfaced in the UI | FR-017, SC-006 |
| Merged value is what FBR validation checks | FBR submission | FR-016 |

**Invariant to protect**: for every invoice line, `InvoiceItems.ProductDescription` equals the `Items.Description` of the product it was raised against. This is what makes stock correct. It held before this feature and must hold after.

---

## API field

The field travels as `subDescription` in JSON, camelCase, matching every other invoice item field (`productDescription`, `salesTaxApplicable`, `sroItemSerialNo`).

Absent, `null` and `""` are accepted on input and all mean the same thing. On output the field is present and may be `null`.

---

## Migration

Rerunnable, guarded, nullable — the house style (research R6):

```sql
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'SubDescription'
)
BEGIN
    ALTER TABLE InvoiceItems ADD SubDescription NVARCHAR(255) NULL;
END
GO
```

No backfill. No data rewrite. Existing rows keep `NULL`, which reads as "no variation" everywhere.

**Reverse**: `ALTER TABLE InvoiceItems DROP COLUMN SubDescription;` — destroys the captured variations but restores prior behaviour exactly, because nothing else changed shape.

---

## State and lifecycle

The sub-description has no state machine. It is written when a line is saved and read when the invoice is loaded.

One interaction with existing behaviour: an invoice that has been assigned an FBR invoice number is treated as finalized and locked. The sub-description inherits that rule — it becomes read-only at the same moment every other line field does. No new locking logic.
