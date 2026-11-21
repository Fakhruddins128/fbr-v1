---
id: 0005
title: Sales Invoice MRP Mode Toggle
stage: general
date: 2026-11-18
surface: agent
model: claude-opus-5
feature: none
branch: 001-invoice-sub-description
user: Fakhruddins128
command: none
labels: ["sales-invoice", "fbr", "pricing", "mrp", "tax-calculation"]
links:
  spec: docs/SALES_INVOICE_MRP_MODE.md
  ticket: null
  adr: null
  pr: null
files:
 - docs/SALES_INVOICE_MRP_MODE.md
 - src/utils/invoiceLineCalculations.ts
 - src/utils/invoiceLineCalculations.test.ts
 - backend/database/add_mrp_fields_to_invoice_items.sql
 - src/pages/SalesInvoice.tsx
 - backend/server.js
tests:
 - src/utils/invoiceLineCalculations.test.ts — 20 passed
 - full suite — 48 passed; src/App.test.tsx suite fails (pre-existing CRA boilerplate)
 - npx tsc --noEmit — clean
 - npm run build — Compiled successfully
 - node --check backend/server.js — OK
---

## Prompt

Act as a senior Developer check attachments and set Sales Invoice as per Requirement. also write a MD of the changes and mark anything confilct or not proper as per current system

Five images were attached:

1. Item Detail form, toggle ON — 15 fields including Retail Market Price (MRP) per Item, Retail Market Price (MRP) Value (Auto-calculate), Discount Value (Auto-calculate), Sale Price per Product, Total Sale Value Excluding ST (Auto-calculate), Sales Tax %, Sales Tax Value, Advance Tax %, Advance Tax Value, Further Tax %, Further Tax Value, SRO / Schedule, Item Serial, HS Code, Product Description, Sub Description, UoM, Qty.
2. Item Detail form, toggle OFF — same form with MRP per Item, MRP Value and Discount Value hidden.
3. "Differences Between the Two Forms" table — Button ON (MRP Mode) shows MRP per Item, MRP Value and Discount Value fields, total 15 fields; Button OFF (Normal Mode) hides all three, total 12 fields.
4. "Updated formulas — Button ON": MRP Value = MRP per Item × Quantity; Discount Value = manually entered discount amount; Total Sale Value Excluding ST = MRP Value − Discount Value; Sale Price per Product = Total Sale Value Excluding ST ÷ Quantity; Sales Tax Value = Total Sale Value Excluding ST × Sales Tax % ÷ 100; Advance Tax Value = Total Sale Value Excluding ST × Advance Tax % ÷ 100; Further Tax Value = Total Sale Value Excluding ST × Further Tax % ÷ 100. Worked example: MRP per Item Rs. 1,500, Quantity 10, MRP Value Rs. 15,000, Discount Value Rs. 3,000, Total Sale Value Excluding ST Rs. 12,000 (15,000 − 3,000 = 12,000), Sale Price per Product = Rs. 1,200. "Button OFF: The existing calculation remains unchanged: Sale Price per Product × Quantity = Total Sale Value Excluding ST."
5. "2. Button OFF (Normal Mode)" table: Sale Price per Product manually entered; Quantity manually entered; Total Sale Value Excluding ST = Sale Price per Product × Quantity; Sales Tax Value = Total × Sales Tax % ÷ 100; Advance Tax Value = Total × Advance Tax % ÷ 100; Further Tax Value = Total × Further Tax % ÷ 100.

## Response snapshot

Read the current Item Detail form before designing, which surfaced two conflicts that would have been destructive to implement literally. Both were put to the user before any code was written.

**Conflict 1 — Advance Tax base.** The system charges Advance Tax on the tax-**inclusive** amount, `(valueSalesExclST + salesTax) × advanceTaxRate / 100`. The requirement specifies the tax-**exclusive** total, for both modes. On an 18% line that is a 15% difference in a figure submitted to FBR, on every existing line. **Decision: exclusive in MRP mode only**; normal mode keeps today's base. The deviation from the supplied formula table is recorded, and the split lives in one named constant.

**Conflict 2 — three FBR fields missing from the mockups.** Extra Tax, Sales Tax Withheld at Source and Total Value of Sales (FPAD) are on the form today and are sent to FBR, but appear in neither mockup, and the quoted field counts confirm they were dropped rather than cropped. Removing them would have silently zeroed FPAD and withholding values. **Decision: keep them on the form.**

Five further conflicts were documented rather than escalated: the specification contradicts itself on Discount Value (mockup says auto-calculate, formula table says manually entered) and on Sale Price per Product in MRP mode (plain input vs derived) — the formula table was taken as authoritative in both cases; `Sales Tax %` is a string `"18%"` today because FBR requires it, so it was left alone; Total Excl. ST becomes read-only in both modes, which is a workflow change the requirement describes inaccurately as "unchanged"; and MRP per Item, Further Tax % and the toggle state had no columns.

Built: a tested pure calculation module covering both modes, a guarded migration for four new columns, the toggle and conditional fields on the form, and persistence through the existing degrade-gracefully probe pattern. `discount: 0` was hardcoded in both the FBR and preview payloads and now carries the real figure — `InvoiceItems.Discount` had existed since the original schema and was never populated.

## Outcome

- ✅ Impact: MRP-mode pricing implemented end to end in code; analysis and conflicts documented in `docs/SALES_INVOICE_MRP_MODE.md`.
- 🧪 Tests: 20 new tests for the calculation module, including the requirement's worked example and an assertion that the two modes differ only in the advance tax base. 48 pass overall; typecheck, build and backend syntax clean.
- 📁 Files: 2 new (calculation module + tests), 1 new migration, 1 new doc, plus `src/pages/SalesInvoice.tsx` and `backend/server.js`.
- 🔁 Next prompts: apply `add_mrp_fields_to_invoice_items.sql`, then walk the test plan in §7 of the doc. Rule on whether a discount exceeding the MRP value should be blocked.
- 🧠 Reflection: Reading the existing calculation before writing any code is what caught the advance tax base change. Implementing the formula table literally would have altered a submitted tax figure on every line, and nothing in the requirement flagged it as a change — it was presented as a restatement of current behaviour.

## Evaluation notes (flywheel)

- Failure modes observed: Three patch scripts aborted mid-sequence — twice from an indentation substring collision (a 10-space anchor matching inside a 12-space line) and once from `\n` in a heredoc collapsing into a real newline inside a generated string literal, which produced a syntax error in `backend/server.js` that `node --check` caught. Each time the script threw before writing, so earlier edits in the same script were silently lost and the file state had to be re-derived.
- Graders run and results (PASS/FAIL): tsc — PASS. Production build — PASS. `node --check backend/server.js` — PASS. Calculation tests 20/20 — PASS. Full suite 48 passed, 1 pre-existing suite failure (`App.test.tsx`).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Stop generating code through heredoc-embedded patch scripts where the payload contains regexes or escape sequences; use the Edit tool for those, and keep the scripts for plain-text multi-site edits only.
