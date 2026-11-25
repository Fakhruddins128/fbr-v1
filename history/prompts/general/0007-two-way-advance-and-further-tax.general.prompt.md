---
id: 0007
title: Two Way Advance And Further Tax
stage: general
date: 2026-11-25
surface: agent
model: claude-opus-5
feature: none
branch: master
user: Fakhruddins128
command: none
labels: ["sales-invoice", "tax-calculation", "fbr", "advance-tax", "further-tax", "precision"]
links:
  spec: docs/SALES_INVOICE_MRP_MODE.md
  ticket: null
  adr: null
  pr: null
files:
 - src/utils/invoiceLineCalculations.ts
 - src/utils/invoiceLineCalculations.test.ts
 - src/pages/SalesInvoice.tsx
 - backend/server.js
 - backend/database/add_mrp_fields_to_invoice_items.sql
 - backend/database/widen_further_tax_rate_to_4dp.sql
 - docs/SALES_INVOICE_MRP_MODE.md
tests:
 - src/utils/invoiceLineCalculations.test.ts — 30 passed (10 added)
 - full suite — 69 passed; src/App.test.tsx suite fails (pre-existing CRA boilerplate)
 - npx tsc --noEmit — clean
 - npm run build — Compiled successfully
 - node --check backend/server.js — OK
---

## Prompt

in sales invoice.
Advance Tax %, Advance Tax value, Further Tax%, Further Tax Value. should be open for Edit.
if type %  then calculate value but its open for edit.
if type Value then calculate % and its open for Edit too

## Response snapshot

Advance Tax Value was `disabled` and Further Tax Value was `readOnly`; both were one-way outputs of their percentage. All four fields are now editable, and each pair calculates in both directions. `rateFromValue(value, base)` was added to the calculation module, and `InvoiceLineTotals` now returns `advanceTaxBase` and `furtherTaxBase` so the back-solve divides by exactly the figure the module multiplied by — which matters because the advance tax base differs by mode (§6: exclusive in MRP mode, inclusive in normal mode).

A typed amount is kept **exactly as typed** rather than re-derived from the rounded percentage, which would move it by paisas the user did not ask for.

**One decision the requirement does not settle.** It says each direction should calculate the other and leave both editable, but not which half wins when the line's sale value later changes. The percentage survives: quantity, price, MRP, discount and the mode toggle all recompute both amounts from their rates. A tax rate is a fact about the sale and an amount is a consequence of it. The alternative — remembering which half was last touched, per line — needs state with no column to live in and no way to survive reopening an invoice. Recorded in the doc as a decision, with the alternative stated.

**A precision defect found while implementing.** A back-solved percentage rarely lands on two decimals: 61 on a 12,000 base is 0.5083%. `AdvanceTaxRate` has always been `DECIMAL(18, 4)`, but `FurtherTaxRate` was added on 2026-11-18 as `DECIMAL(5, 2)`, which would round that to 0.51 and recompute the amount as 61.20 on the next edit. Three places needed fixing: the column (the original migration now creates it at 18,4, plus a new guarded `widen_further_tax_rate_to_4dp.sql` for databases that ran the earlier version), the two `sql.Decimal(5, 2)` insert bindings in `backend/server.js` which would have rounded at the driver whatever the column said, and the four `CAST(NULL AS DECIMAL(5, 2))` fallbacks.

Typing an amount before the line has any sale value cannot yield a percentage. The amount is kept and a warning says it will be recalculated as 0 once the line has a value, rather than letting it disappear silently on the next edit.

## Outcome

- ✅ Impact: all four tax fields editable with two-way calculation; `FurtherTaxRate` precision corrected at column, driver and fallback.
- 🧪 Tests: 10 added over `rateFromValue` and the returned bases — round percentages, four-decimal back-solves, round-trips, zero/negative/NaN bases, and the mode split. 30 in that suite, 69 overall. Typecheck, build and `node --check` clean.
- 📁 Files: 1 new migration, plus the calculation module and its tests, `SalesInvoice.tsx`, `backend/server.js`, the earlier migration and §10 of the doc.
- 🔁 Next prompts: run `widen_further_tax_rate_to_4dp.sql` (and `add_mrp_fields_to_invoice_items.sql`, still unapplied). Check in a browser that a decimal can be typed into the two amount fields.
- 🧠 Reflection: the request was a UI change — remove two `disabled` attributes and add an inverse. The real work was in what the inverse implies: which half is authoritative when the base moves, and whether the schema can even hold a back-solved rate. The `DECIMAL(5, 2)` column I wrote myself a week ago was the actual defect, and it only became one because of this feature.

## Evaluation notes (flywheel)

- Failure modes observed: none in this change. Edits were applied with the Edit tool for anything containing a regex or template literal, and with a Python heredoc (asserting an exact occurrence count before writing) for the repeated mechanical replacements in `backend/server.js` — 2 bindings and 4 casts, each verified by grep afterwards.
- Graders run and results (PASS/FAIL): tsc — PASS. Production build — PASS. `node --check backend/server.js` — PASS. Calculation tests 30/30 — PASS. Full suite 69 passed, 1 pre-existing suite failure (`App.test.tsx`).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): when adding a numeric column, match the precision of the column it mirrors rather than guessing from the current range of values — `FurtherTaxRate` at `DECIMAL(5, 2)` looked ample for a percentage and was not, the moment the percentage became derived.
