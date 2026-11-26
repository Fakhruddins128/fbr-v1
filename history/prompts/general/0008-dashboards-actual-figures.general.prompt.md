---
id: 0008
title: Dashboards Actual Figures
stage: general
date: 2026-11-25
surface: agent
model: claude-opus-5
feature: none
branch: master
user: Fakhruddins128
command: none
labels: ["dashboard", "reports", "data-integrity", "mock-data", "sql", "profit"]
links:
  spec: docs/DASHBOARD_ACTUAL_FIGURES.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/lib/invoiceLineSql.js
 - backend/lib/invoiceLineSql.test.js
 - backend/server.js
 - src/pages/Reports.tsx
 - src/pages/Invoices.tsx
 - src/services/reportsApi.ts
 - src/services/dashboardApi.ts
 - docs/DASHBOARD_ACTUAL_FIGURES.md
tests:
 - backend/lib/invoiceLineSql.test.js — 13 passed
 - full frontend suite — 69 passed; src/App.test.tsx suite fails (pre-existing CRA boilerplate)
 - npx tsc --noEmit — clean
 - npm run build — Compiled successfully
 - node --check backend/server.js — OK
---

## Prompt

update All Dashboard as actual.

## Response snapshot

Three separate causes, in rising order of severity.

**1. The root defect: `Invoices.TotalAmount` is not the invoice total.** `SalesInvoice.tsx` writes it as `items.reduce((sum, item) => sum + item.totalValueSales, 0)`, and `totalValueSales` is the form field "Total Value of Sales (in case of FPAD only)" — typed by hand, defaulting to 0, never calculated. So the column is 0 on most invoices, and every figure built on `SUM(TotalAmount)` read as zero or near-zero: Dashboard Total Sales, Sale Excl. Tax, the Sales Overview chart, Recent Activities amounts, and in Reports the Sales column, Top Customers and Top Products. The Invoices page had been silently working around it for some time by rebuilding from the lines whenever the column read 0 — which is why the invoice list looked right while the dashboard did not.

Fixed with one definition of a line's worth in a new `backend/lib/invoiceLineSql.js`, used by every dashboard and report query, matching NET TOTAL on the printed invoice. It probes `sys.columns` for `AdvanceTaxValue`, `Discount` and `IsMrpMode` so a database missing a later migration still reports real figures, and rejects any alias that is not a plain identifier.

**2. Two invented figures in the live path of `/api/reports/sales`**, not in a fallback — shown as real every time the report opened. `purchases: sales * 0.7` and `profit: SUM(TotalAmount * 0.1)`. Purchases now sum from the `Purchases` table for the same period. Profit is now sale value excluding tax less cost of goods sold, where cost is the weighted-average purchase price per item across received purchases. The label changed from "Total Profit" to "Gross Profit" because that is what it is, and the endpoint returns `uncostedSales` — the sale value of lines whose item was never purchased through the system and so contributes 0 to COGS — which the card now names when non-zero.

**3. Fabricated data when the database is unreachable.** Both endpoints had an `else` branch returning 150 invoices, Rs 750,000 of sales and a 2024 chart, indistinguishable on screen from real figures. Both now return 503, as `/api/reports/fbr-compliance-summary` already did, and the two API services surface the server's message instead of "HTTP error! status: 503". A behaviour change, stated as such.

Also corrected: `orders` was `COUNT(*)` and became `COUNT(DISTINCT InvoiceID)`, which matters now the query reads from lines; "Sale Excl. Tax" was total-minus-sales-tax, which ignored further, extra and advance tax; and `Invoices.tsx` double-deducted MRP discounts and omitted advance tax in its rebuild — the same defect fixed in the printed templates — and now always prefers the lines so it cannot disagree with the server on an FPAD invoice.

Deliberately not changed: the invoice save path. `finalInvoiceTotal`, the computed total the form already sends, is `salesInclST + advanceTaxValue` and excludes further and extra tax, so adopting it would introduce a second, quietly different total. Nothing on screen depends on the column any more. Two further findings recorded but not fixed: `TotalDiscount` is written as `reduce((sum, item) => sum + 0, 0)`, and `advanceTaxPercent`/`advanceTaxValue`/`finalInvoiceTotal` are sent with the header but have no columns and are silently discarded.

## Outcome

- ✅ Impact: every Dashboard and Reports figure now derives from recorded data; two fabricated figures and two mock fallbacks removed.
- 🧪 Tests: 13 new tests for the SQL fragments, which translate each fragment to JavaScript and evaluate it against sample lines so the `CASE` ordering and arithmetic are exercised rather than just the text. Frontend suite 69 passed; typecheck, build and `node --check` clean.
- 📁 Files: 2 new backend files, 1 new doc, plus `server.js`, `Reports.tsx`, `Invoices.tsx` and the two API services.
- 🔁 Next prompts: run the app against a real database and check Dashboard Total Sales against the Invoices page total — that is the single best confirmation. Then decide whether to repair `Invoices.TotalAmount` at the source, which needs a definition and a backfill.
- 🧠 Reflection: the request read as a UI task and was a data-integrity one. Nothing on the Dashboard was wired to mock data — the frontend was reading the API correctly all along; the API was summing a column that holds a hand-typed FPAD field. The decisive clue was `calculateInvoiceTotal` in `Invoices.tsx`: a client-side workaround that only makes sense if the column it guards against is unreliable.

## Evaluation notes (flywheel)

- Failure modes observed: twice replaced an `if (isDbConnected) {` with an early return and left the matching `} else {` orphaned, which `node --check` caught both times. Removing the two mock branches by line index with assertions on the exact boundary lines worked cleanly. The first SQL-to-JavaScript translator in the new test was too crude — stripping `CASE` left unbalanced parentheses, and SQL's single `=` became an assignment — both surfaced as failing tests rather than false passes.
- Graders run and results (PASS/FAIL): `node --check backend/server.js` — PASS. SQL fragment tests 13/13 — PASS. tsc — PASS. Production build — PASS. Frontend suite 69 passed, 1 pre-existing suite failure (`App.test.tsx`).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): when a figure looks wrong on a dashboard, check whether any other screen already compensates for it in client code before touching the query — that workaround names the untrustworthy column faster than reading the query does.
