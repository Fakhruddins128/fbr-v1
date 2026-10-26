# Phase 0 Research: Optional Product Sub-Description on Sales Invoice Lines

**Feature**: `001-invoice-sub-description`
**Date**: 2026-10-26
**Spec**: [spec.md](./spec.md)

Everything below was established by reading the code and schema in this repository, not assumed.

---

## R1. Where the invoice line description lives

**Decision**: Store the sub-description in a new nullable `SubDescription` column on `InvoiceItems`. `ProductDescription` keeps the catalogue product name, unchanged.

**Rationale**: `InvoiceItems` is the sales invoice detail table (`backend/database/setup100526.sql:521`). It already holds `ProductDescription NVARCHAR(255) NOT NULL` alongside `HSCode`, quantity, values and taxes. A sibling nullable column is the smallest change that gives each line its own independent value, satisfying FR-003 and FR-010.

**Alternatives considered**:
- *Overwrite `ProductDescription` with the merged value.* Rejected — breaks stock (see R2). This is the obvious implementation and the one most likely to be reached for.
- *Separate child table keyed to the line.* Rejected — one optional scalar per line does not justify a join, and nothing else would live in it.
- *Encode the variation inside `ProductDescription` with a delimiter and parse it back.* Rejected — same stock breakage as overwriting, plus it makes the stored value ambiguous when a product name legitimately contains the separator.

---

## R2. What depends on `InvoiceItems.ProductDescription` matching the catalogue

**Decision**: `ProductDescription` is load-bearing and must continue to hold the catalogue product name verbatim. This is the central constraint of the feature (FR-011).

**Rationale**: Stock is not stored. It is derived every time it is read, by matching invoice lines back to catalogue items on `HSCode` **and** `ProductDescription`. Four places do this:

| # | Location | What breaks if the merged value is stored |
|---|---|---|
| 1 | `backend/server.js:3271` — `/api/items` current stock | Sold quantities stop counting; stock overstates on every screen that reads items |
| 2 | `backend/server.js:5325` — Inventory Report per item | Sold column reads 0; Balance overstates |
| 3 | `backend/server.js:5533` — `/api/dashboard/stats` | Dashboard stock figures overstate |
| 4 | `src/pages/SalesInvoice.tsx:1302` — `getAvailableStock` | Editing an invoice stops crediting back its own quantities, producing false "exceeds available stock" warnings |

The failure mode in all four is silent: no error, just wrong numbers that look plausible. Sites 1–3 use SQL equality (`ii.ProductDescription = CAST(it.Description AS NVARCHAR(255))`); site 4 uses JavaScript `===`. Neither tolerates a suffix.

**Alternatives considered**:
- *Store merged, and change all four matchers to compare on a prefix or on `MasterItemID`.* Rejected for this feature. `MasterItemID` is the better long-term key and would make the join robust, but it is nullable on older rows and the change would touch stock correctness across the whole application — far beyond this feature's scope. Recorded as a follow-up, not a dependency.

---

## R3. Everywhere the merged description must appear

**Decision**: Merge at the point of display or submission, from one shared helper. Do not merge at save time.

**Rationale**: FR-009 requires identical output in five places. A single helper applied at each boundary is the only way to guarantee that; merging at save time would write the merged value into storage, which R2 forbids.

Touchpoints, from reading the call sites:

| Path | File | Note |
|---|---|---|
| Line entry / grid | `src/pages/SalesInvoice.tsx` | Sub-description input lives here |
| Preview + print + PDF | `src/components/SalesInvoiceReport.tsx` | All three render through this one component, across four templates |
| Invoices list preview | `src/pages/Invoices.tsx` | Passes saved line items into the report component |
| FBR payload | `src/pages/SalesInvoice.tsx` — `prepareFbrPayload()` | Sends `productDescription` |
| FBR validation | `src/utils/fbrUtils.ts:62` | Must validate the merged value, per FR-016 |

`src/components/sales/FBRInvoiceSubmission.tsx` and `src/pages/FBRIntegration.tsx` also reference `productDescription`, but as sample/debug payloads rather than the live invoice path. Confirm during implementation; do not change them speculatively.

**Alternatives considered**:
- *Merge once in the API response so every consumer gets it pre-merged.* Rejected — the API response feeds the stock matcher at site 4 in R2, which needs the unmerged name.

---

## R4. Scenario detection must keep seeing the product name

**Decision**: FBR scenario detection reads the unmerged product name, not the merged description.

**Rationale**: `determineFbrScenario()` in `src/pages/SalesInvoice.tsx:1540-1546` selects the FBR scenario by substring-matching the description for `scrap`, `ship breaking`, `ship breaker`. Feeding it the merged value would let a user's free-text variation change which tax scenario is submitted — for example a sub-description containing the word "scrap" flipping an unrelated invoice to SN004. Spec FR-014 and FR-015 require FBR behaviour and tax treatment to be unaffected by this feature, so scenario detection must read the product name exactly as it does today.

**Alternatives considered**:
- *Match on the merged value for completeness.* Rejected — it hands users unintended control over tax scenario selection through a free-text field.

---

## R5. Length limits and the FR-017 warning

**Decision**: Validate the merged length client-side before submission, against the smaller of the storage capacity and the FBR limit. Warn, never truncate.

**Rationale**: `ProductDescription` is `NVARCHAR(255)`. A merged value is `name + 3 + variation` characters. If the merged value is what reaches FBR, the practical ceiling for the sub-description is `255 - len(productName) - 3` before storage of the equivalent text would overflow — though note the merged value itself is never stored under this design, so the binding limit is FBR's own field rule.

**NEEDS CLARIFICATION — resolved by decision**: FBR's published maximum for `productDescription` is not stated in this repository, and `src/utils/fbrUtils.ts:62` only checks presence, not length. Rather than guess a number and hard-code it, the plan sets the `SubDescription` column at `NVARCHAR(255)` (matching its sibling) and validates the *merged* result against a single named constant with a conservative default of 255 characters, sourced in one place so it can be corrected without hunting. If FBR documentation later gives a different figure, one constant changes.

**Alternatives considered**:
- *Silently truncate to fit.* Rejected outright — SC-006 requires that no description reaches the tax authority that the user did not see and approve.
- *Let FBR reject it and surface the error.* Rejected as the only mechanism — a round-trip failure after the user believes the invoice is complete is poor, and FBR submission is the point of no return for an invoice. Client-side warning first; FBR's own validation remains the backstop.

---

## R6. Migration style

**Decision**: Add the column with a rerunnable guarded script in `backend/database/`, following the existing convention.

**Rationale**: Every migration in `backend/database/` guards with `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('<table>') AND name = '<column>')`. `add_advance_tax_to_invoice_items.sql` is the closest precedent — same table, same shape of change. The column must be `NULL`-able so existing rows need no backfill (FR-012).

**Alternatives considered**:
- *`NOT NULL DEFAULT ''`.* Rejected — makes "never set" and "set to empty" indistinguishable in storage for no benefit, and rewrites every existing row.
- *Run the migration at server startup.* Rejected — there is a commented-out startup migration block at `backend/server.js:85-103` that was deliberately disabled. Do not revive that pattern.

---

## R7. Tolerating a database without the column

**Decision**: Probe `sys.columns` for `SubDescription` and degrade gracefully, exactly as the existing code does for `MasterItemID`, `AdvanceTaxRate`, `AdvanceTaxValue`, `Discount`, `SaleType` and `SROItemSerialNo`.

**Rationale**: Four handlers in `backend/server.js` (lines 237, 389, 585, 995) already build their column list from a `sys.columns` probe, selecting a literal when a column is absent. An application deployed against a database where the migration has not yet run must keep working. Adding `SubDescription` to those existing probe lists is the established pattern and costs one array entry per site.

This also means the migration and the code can be deployed in either order, which matters because the deployment process for this project is not automated.

**Alternatives considered**:
- *Assume the column exists.* Rejected — the probe pattern exists precisely because that assumption has failed before in this codebase. The Advance Tax columns are the documented case.

---

## Open items carried into Phase 1

| Item | Status |
|---|---|
| FBR's exact `productDescription` maximum length | Not documented in this repo. R5 isolates it to one constant, default 255. Confirm against FBR documentation before release. |
| Whether `MasterItemID` should eventually replace description-matching for stock | Out of scope here. Recorded as a follow-up; it would make R2's constraint unnecessary. |
