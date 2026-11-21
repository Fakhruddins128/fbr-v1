---
id: 0006
title: Template Five MRP Invoice Sheet
stage: general
date: 2026-11-18
surface: agent
model: claude-opus-5
feature: none
branch: 001-invoice-sub-description
user: Fakhruddins128
command: none
labels: ["sales-invoice", "print-template", "mrp", "fbr", "tax-calculation"]
links:
  spec: docs/SALES_INVOICE_MRP_MODE.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/SalesInvoiceReport.tsx
 - src/components/SalesInvoiceReport.totals.test.ts
 - src/types/index.ts
 - src/pages/CompanyManagement.tsx
 - src/pages/SalesInvoice.tsx
 - docs/SALES_INVOICE_MRP_MODE.md
tests:
 - src/components/SalesInvoiceReport.totals.test.ts — 11 passed
 - full suite — 59 passed; src/App.test.tsx suite fails (pre-existing CRA boilerplate)
 - npx tsc --noEmit — clean
 - npm run build — Compiled successfully
---

## Prompt

make template5 same as template2 for MRP users

## Response snapshot

Template 2 has no column for a retail price, so an MRP-priced line printed on it showed only the derived unit price and the net exclusive value — the retail price the buyer recognises and the discount granted were both invisible. Template 5 is that sheet with the three MRP figures restored: **M.R.P. Per Item**, **M.R.P. Value** and **Discount**, inserted between Description and Unit Price, twelve columns where Template 2 has nine, with the table type dropped from 1.00rem to 0.78rem to hold the same A4 width.

The toggle is per line, so a mixed invoice is possible: a line priced as unit price × quantity prints `-` in all three columns. The totals row and the two new summary rows (`M.R.P. VALUE`, `LESS DISCOUNT`) appear only when at least one line is in MRP mode, and those figures foot — MRP value − discount = the exclusive subtotal.

No migration: `Companies.SalesInvoiceTemplate` is `NVARCHAR(50)` with no check constraint.

**Two defects found while reading the surrounding code, both fixed.**

*The printed advance tax rate.* Template 2 derives its `@ x%` by dividing total advance tax by the tax-inclusive amount. Since MRP lines are charged on the tax-exclusive total (the §6 decision), that division understates the rate — the worked example charges 0.5% and Template 2 would print `@ 0.4%`. Template 5 derives the rate against the sum of each line's own base, correct in both modes. Template 2 is untouched.

*A double deduction on Templates 1 and 4.* Both subtract `item.discount` from their totals. Harmless while `discount` was hardcoded to 0, and a real defect the moment MRP mode began populating it: an MRP line's discount is already inside `valueSalesExcludingST`, so those sheets took it off twice. `calculateTotals` now returns `totalDiscount` (still to be deducted; 0 for an MRP line) for every existing arithmetic ladder, and `discountGiven` (granted across all lines) for Template 5's display. Template 1's per-line total was fixed the same way.

`prepareInvoiceData` in `SalesInvoice.tsx` was not passing `isMrpMode`, `mrpPerItem` or `salePricePerProduct` to the preview, so an unsaved invoice would have printed as normal mode while the saved one printed correctly. Now wired.

## Outcome

- ✅ Impact: Template 5 available in the company picker, labelled "Template 2 with MRP columns". Templates 1 and 4 corrected for MRP invoices; Templates 2 and 3 unchanged.
- 🧪 Tests: 11 new tests over the footer arithmetic — `mrpValueOf`, `advanceTaxBaseOf`, `deductibleDiscountOf`, `calculateTotals` — covering both modes and a mixed invoice. 59 pass overall; typecheck and build clean.
- 📁 Files: 1 new test file, plus `SalesInvoiceReport.tsx`, `types/index.ts`, `CompanyManagement.tsx`, `SalesInvoice.tsx` and §9 of the MRP doc.
- 🔁 Next prompts: print Template 5 and confirm 12 columns fit inside the A4 margin at one page. Apply `add_mrp_fields_to_invoice_items.sql` — until then no saved invoice prints as MRP mode.
- 🧠 Reflection: The request was "same as template2", and the honest answer was that the same sheet is not sufficient for MRP pricing — three columns had to be added for the figures to appear at all. Reading Templates 1 and 4 while cloning Template 2 is what surfaced the double deduction, which no test covered because `discount` had been 0 since the schema was written.

## Evaluation notes (flywheel)

- Failure modes observed: one Edit anchor matched three sites in `SalesInvoice.tsx` (the same item-mapping shape appears in the FBR payload, the preview payload and the save payload). Widening the anchor to include the following lines resolved it, and the result was verified by grepping the new line numbers against the enclosing function rather than trusting that a unique match was the intended one.
- Graders run and results (PASS/FAIL): tsc — PASS. Production build — PASS. New totals tests 11/11 — PASS. Full suite 59 passed, 1 pre-existing suite failure (`App.test.tsx`).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): when cloning a template, read every sibling that consumes the same derived helper before changing the helper's contract — `calculateTotals` is shared by four sheets and two of them were quietly wrong.
