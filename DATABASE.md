# Database — Claude Working Reference

## Database Engine

Microsoft SQL Server.

## Core Entities

The project documentation and migration history include entities such as:

- Companies
- Users
- Invoices
- InvoiceItems
- Items
- Customers
- Vendors
- Purchases
- FBR/company integration data
- Scenario mapping data

## Tenant Key

`CompanyID` is the primary tenant-isolation key across company-owned data.

## Invoice Items

Current backend code references fields including:

- `ItemID`
- `MasterItemID`
- `InvoiceID`
- `HSCode`
- `ProductDescription`
- `Rate`
- `UoM`
- `Quantity`
- `TotalValues`
- `ValueSalesExcludingST`
- `FixedNotifiedValueOrRetailPrice`
- `SalesTaxApplicable`
- `SalesTaxWithheldAtSource`
- `AdvanceTaxValue`
- `AdvanceTaxRate`
- `ExtraTax`
- `FurtherTax`
- `SROScheduleNo`
- `FEDPayable`
- `Discount`
- `SaleType`
- `SROItemSerialNo`

Do not assume every historical database has every field. Existing backend compatibility checks intentionally account for migration state.

## Migration Files

Review SQL scripts under:

- `backend/database/`
- `backend/migrations/`
- `database/schema/`

Before adding a column, search for existing migrations and current backend references.

## Database Safety

Never execute destructive schema/data operations without explicit approval. Prefer additive migrations with safe defaults where appropriate.
