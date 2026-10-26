# Quickstart: Optional Product Sub-Description

**Feature**: `001-invoice-sub-description`
**Branch**: `001-invoice-sub-description`

How to run, exercise and verify this feature. Read [research.md](./research.md) R2 before changing anything — one wrong line silently breaks stock.

---

## 1. Apply the migration

```bash
sqlcmd -S <server> -d FBR_SaaS -i backend/database/add_sub_description_to_invoice_items.sql
```

Rerunnable — running it twice is a no-op. Confirm:

```sql
SELECT name, system_type_id, is_nullable
FROM sys.columns
WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'SubDescription';
```

Expect one row, nullable. If the migration has not run, the application still works: the column is probed and treated as absent (research R7).

---

## 2. Run it

```bash
cd backend && npm install && npm start     # API
npm install && npm start                   # frontend, from repo root
```

---

## 3. Walk the feature

1. **Sales Invoice → new invoice.** Pick a product. The name fills in as before; the new Sub-Description box is empty.
2. Type `Size 30mm`. The line reads `Ink Roll - Size 30mm`.
3. Add a second line, same product, sub-description `Size 50mm`. Confirm line one is untouched.
4. Add a third line, same product, leave the box blank. It reads `Ink Roll`.
5. **Save.** Reopen from Invoices. All three lines come back as entered.
6. **Preview, print, export PDF.** The merged text is identical in all three.
7. **Submit to FBR.** The payload's `productDescription` carries the merged value; `hsCode` is unchanged.

---

## 4. Verify the thing most likely to be broken

This is the check that matters. Stock is derived by matching invoice lines to catalogue products on HS Code **and** product name (research R2). If the merged value reached storage, sold quantities stop counting and stock silently overstates.

**Before** raising the invoice, note the product's Current Stock on the Items page.

**After** saving an invoice for quantity 10 with a sub-description:

```sql
-- Must return the catalogue name ALONE, never 'Ink Roll - Size 30mm'
SELECT ProductDescription, SubDescription, Quantity
FROM InvoiceItems
WHERE InvoiceID = '<id>';
```

Then confirm all four readers still agree:

| Check | Expected |
|---|---|
| Items page → Current Stock | fell by 10 |
| Reports → Inventory Report → Sold | includes the 10 |
| Dashboard stock figures | consistent with Items |
| Reopen the invoice for edit | no false "exceeds available stock" warning |

If stock did **not** move, `ProductDescription` was written with the merged value. That is the failure this feature is designed around.

---

## 5. Cases to cover

| Case | Expected |
|---|---|
| Blank sub-description | `Ink Roll`, no separator |
| Whitespace only (`"   "`) | `Ink Roll`, stored as `NULL` |
| Leading/trailing spaces (`"  Size 30mm  "`) | `Ink Roll - Size 30mm` |
| Separator inside the value (`"Size 30mm - Blue"`) | `Ink Roll - Size 30mm - Blue` |
| Same product on three lines, different values | each line independent |
| Clear a saved value and re-save | reopens blank, reads `Ink Roll` |
| Invoice created before this feature | opens, prints and re-submits unchanged |
| Merged value longer than the limit | user warned before submission; never silently truncated |
| Sub-description containing `scrap` | FBR scenario unchanged — detection reads the product name, not the merged value (research R4) |
| Invoice already submitted to FBR | sub-description read-only, like every other line field |

---

## 6. Regression surface

Re-check anything that reads an invoice line description:

- `src/components/SalesInvoiceReport.tsx` — all four templates, since preview, print and PDF all render through it
- `src/pages/Invoices.tsx` — list preview
- `src/pages/SalesInvoice.tsx` — entry grid, `prepareFbrPayload()`, `determineFbrScenario()`, `getAvailableStock()`
- `src/utils/fbrUtils.ts` — validates the merged value
- Sales Register and Inventory Report — both read `ProductDescription` directly

---

## 7. Automated checks

```bash
npx tsc --noEmit -p tsconfig.json      # types
npm run build                           # production build
CI=true npx react-scripts test --watchAll=false
node --check backend/server.js          # API syntax
```

The merge rule is pure and table-driven — unit-test it against the table in [data-model.md](./data-model.md) rather than only exercising it through the UI.

---

## 8. Rollback

```sql
ALTER TABLE InvoiceItems DROP COLUMN SubDescription;
```

Destroys captured variations but restores prior behaviour exactly, because nothing else changed shape. Revert the code first — with the column probe in place (research R7), code and schema can be rolled back in either order.
