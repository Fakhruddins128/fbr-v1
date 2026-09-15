# Business Rules

## Multi-Tenant Access

- Each company is a tenant.
- Tenant-owned records must be associated with `CompanyID`.
- Company users must not access another company's records.
- Super Admin has elevated permissions for company administration and selected cross-company operations.

## Sales Invoice

- Users create/edit invoice header and line-item data.
- Items can be selected from the company-specific item master.
- HS code and product description are related; existing logic reconstructs the combined display when reopening invoices.
- Tax and total calculations must remain consistent across create, edit, save, display, print, and FBR submission.

## FBR

- FBR payload fields must use the expected data types.
- Tax values that are numerically required must not be sent as accidental empty strings.
- Sandbox and production environments must remain distinguishable through configuration.
- Successful FBR submission produces an FBR invoice number/status that must be persisted.
- Existing FBR error handling should remain intact.

## Invoice Tax Fields

The current implementation contains fields including:

- Sales Tax
- Extra Tax
- Further Tax
- Advance Tax Rate
- Advance Tax Value
- FED
- Discount

When modifying a tax field, inspect both `SalesInvoice.tsx` and backend invoice persistence/payload code, plus relevant SQL migration scripts.

## Input Restrictions

Global editable-field restrictions currently block Enter and the characters `'`, `"`, `\\`, `/`, CR, and LF during keyboard input, before-input, paste, and drop. Preserve this unless explicitly changed.
