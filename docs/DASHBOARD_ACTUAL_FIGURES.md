# Dashboards and reports: actual figures

Written for: whoever maintains the dashboard, reports and invoice totals in this
codebase, and anyone who needs to explain a figure on screen to an accountant.

Date: 2026-11-25.

---

## 1. The request

> update All Dashboard as actual.

Every figure on the Dashboard and on the Reports & Analytics *Business Reports*
tab should reflect real recorded data. Three separate things were preventing
that, in rising order of severity.

---

## 2. The root defect: `Invoices.TotalAmount` is not the invoice total

`SalesInvoice.tsx` writes the invoice header like this:

```ts
const totalAmount = formData.items.reduce((sum, item) => sum + item.totalValueSales, 0);
```

`item.totalValueSales` is the form field labelled **"Total Value of Sales (in
case of FPAD only)"**. It is typed by hand, defaults to 0, and is never
calculated from anything. On any invoice that is not FPAD it stays 0.

So `Invoices.TotalAmount` is **0 for most invoices**, and every figure built on
`SUM(TotalAmount)` read as zero or near-zero:

| Surface | Figure | Was |
|---|---|---|
| Dashboard | Total Sales | `SUM(Invoices.TotalAmount)` |
| Dashboard | Sale Excl. Tax | `SUM(TotalAmount) - SUM(TotalSalesTax)` |
| Dashboard | Sales Overview chart | `SUM(TotalAmount)` per month |
| Dashboard | Recent Activities amounts | `Invoices.TotalAmount` |
| Reports | Total Sales, Sales column | `SUM(TotalAmount)` per period |
| Reports | Top Customers amount and % | `SUM(TotalAmount)` per buyer |
| Reports | Top Products sales and % | `SUM(InvoiceItems.TotalValues)` — the same FPAD field, per line |

The Invoices page had already been working around this since before this change:
`calculateInvoiceTotal` rebuilt the figure from the lines whenever `totalAmount`
read as 0. That workaround is why the invoice list looked right while the
dashboard did not.

### The fix

A single definition of what a line is worth, in
[`backend/lib/invoiceLineSql.js`](../backend/lib/invoiceLineSql.js), used by
every dashboard and report query:

```
exclusive = TotalValues, or ValueSalesExcludingST, or FixedNotifiedValueOrRetailPrice
net       = exclusive + SalesTaxApplicable + FurtherTax + ExtraTax + AdvanceTaxValue
            - (IsMrpMode ? 0 : Discount)
```

`net` matches **NET TOTAL on the printed invoice**, so the dashboard, the invoice
list and the printed sheet now agree.

The module probes `sys.columns` for `AdvanceTaxValue`, `Discount` and
`IsMrpMode`, each of which arrived in a later migration, so a database that has
not run them still reports real figures instead of failing on an unknown column.
It rejects any table alias that is not a plain identifier.

`Invoices.TotalAmount` **has not been changed.** See §6.

---

## 3. Two invented figures in the Reports tab

Both were in the **live database path**, not a fallback — they were presented as
real whenever the report was opened.

### Purchases

```js
purchases: parseFloat(row.sales) * 0.7 || 0, // Mock purchases as 70% of sales
```

The *Total Purchases* card and the *Purchases* column were 70% of sales, always,
regardless of what was actually bought. Now summed from `Purchases` for the same
period, matching the Purchases page: every `IsActive` row, dated by
`COALESCE(Date, PODate, CreatedAt)`.

### Profit

```sql
SUM(i.TotalAmount * 0.1) as profit
```

A flat 10% of a column that is itself usually 0. Now:

```
gross profit = sale value excluding tax − cost of goods sold
```

where cost is the **weighted-average purchase price** per item
(`SUM(PurchasePrice × PurchaseQty) / SUM(PurchaseQty)`) over all received or
completed purchases, keyed on HS code plus description — the same key the rest of
the app uses for items. Cost is deliberately *not* filtered to the report period:
what was sold this month cost what it cost whenever it was bought.

**This is a real figure with a stated limitation.** An item never purchased
through the system has no recorded cost, so it contributes 0 to COGS and its
whole sale value to profit. The endpoint returns `uncostedSales` for exactly that
amount, and the card now reads *"Excl. tax, less cost of sales. Rs X of sales
have no recorded cost."* when it is non-zero. The label changed from **Total
Profit** to **Gross Profit**, because that is what it is — there is nothing in
the schema for operating costs.

Weighted average is not FIFO. If stock accounting matters to a tax filing, this
figure is indicative, not an audited cost of sales.

---

## 4. Fabricated data when the database is unreachable

`/api/dashboard/stats` and `/api/reports/sales` each had an `else` branch
returning invented figures — 150 invoices, Rs 750,000 of sales, a six-month chart
of 2024 data — whenever `isDbConnected` was false. Nothing on screen distinguished
them from real figures.

Both now return **503** with a message saying the database is unreachable, which
is what `/api/reports/fbr-compliance-summary` already did. `dashboardApi` and
`reportsApi` were reading only `response.status` on failure, so the user saw
"HTTP error! status: 503"; they now surface the server's own message.

The startup log claimed "All data is mocked for demo purposes", which is no
longer true of these two endpoints; it now says dashboards and reports return 503
and that some other endpoints still serve demo data.

**This is a behaviour change.** If you were relying on the dashboard rendering
without a database — for a demo or a screenshot — it no longer does.

---

## 5. Also corrected

- **`orders` was `COUNT(*)` over invoice rows** in Reports. Now
  `COUNT(DISTINCT InvoiceID)`, which matters because the query now reads from
  `InvoiceItems` and would otherwise count lines as orders.
- **Dashboard "Sale Excl. Tax"** was `TotalAmount − TotalSalesTax`, which ignored
  further, extra and advance tax and so overstated the exclusive value. Now
  summed from the lines directly.
- **`Invoices.tsx` double-deducted MRP discounts** and omitted advance tax from
  its client-side rebuild — the same defect fixed in the printed templates. It
  now applies the identical rule and always prefers the lines over `TotalAmount`,
  so it cannot disagree with the server on an FPAD invoice.

---

## 6. What was deliberately not changed

**The invoice save path.** `Invoices.TotalAmount` still stores the FPAD-only sum.
Fixing it at the source is the real repair, but:

- it would change what is written for new invoices while historical rows stay as
  they are, and
- `finalInvoiceTotal`, the computed total the form already sends, is
  `salesInclST + advanceTaxValue` — it excludes further and extra tax, so it does
  **not** match the definition in §2. Adopting it would introduce a second,
  quietly different total.

Every dashboard and report now ignores the column, so nothing on screen depends
on it. Repairing it is a separate change that needs a decision on which
definition wins, and a backfill.

Related, found while reading that code and **not** fixed:

- `Invoices.TotalDiscount` is written as `items.reduce((sum, item) => sum + 0, 0)`
  — literally always 0, with a stale comment claiming there is no discount field.
  There is one now.
- The form sends `advanceTaxPercent`, `advanceTaxValue` and `finalInvoiceTotal`
  with the invoice header. **There are no columns for them** and the insert does
  not list them, so all three are silently discarded. The per-line values on
  `InvoiceItems` are what the preview and the printed sheet actually read.

---

## 7. Changed files

| File | Change |
|---|---|
| `backend/lib/invoiceLineSql.js` | **New.** The one definition of a line's exclusive and net value, plus the `sys.columns` probe. |
| `backend/lib/invoiceLineSql.test.js` | **New.** 13 tests. Run with `node backend/lib/invoiceLineSql.test.js`. |
| `backend/server.js` | Both endpoints rewritten to derive from lines; real purchases; real COGS-based profit; mock branches removed; startup log corrected. |
| `src/pages/Reports.tsx` | "Total Profit" → "Gross Profit" with its basis and the uncosted-sales caveat; column header renamed. |
| `src/services/reportsApi.ts` | `ReportData` gains `salesExclTax`, `cogs`, `uncostedSales`; failures surface the server's message. |
| `src/services/dashboardApi.ts` | `profit` documented as "Sale Excl. Tax"; failures surface the server's message. |
| `src/pages/Invoices.tsx` | Client-side rebuild aligned with the server. |

### Testing

`backend/lib/invoiceLineSql.test.js` is a plain node script, not a jest spec,
because this project's jest comes from `react-scripts`, whose `roots` is pinned to
`src/` and is not one of the keys CRA allows to be overridden — a spec placed in
`backend/` would never be discovered by `npm test`.

It translates each SQL fragment into JavaScript and evaluates it against sample
lines, so it exercises the `CASE` ordering and the arithmetic, not just the text.

---

## 8. Not verified

**No database was available, so not one figure here has been seen on screen.**
What has been checked: the generated SQL fragments (13 tests), that the server
file parses, that the frontend typechecks and builds, and that the full frontend
suite passes.

What has **not** been checked, and should be before trusting the output:

- that the queries execute — in particular the `ItemCost` CTE, which casts
  `Items.Description` from `NTEXT` to group by it, and joins
  `PurchaseItems.ItemID` as `NVARCHAR(50)` against `Items.ItemID`;
- that Dashboard Total Sales now matches the sum of the Invoices page's Total
  Amount column, which is the single best check that §2 is right;
- that Gross Profit is plausible against a known month, and what fraction of
  sales reports as uncosted;
- that a 503 renders as a readable message rather than an empty dashboard.
