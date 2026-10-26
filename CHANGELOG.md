# Changelog / Existing Project Context

This file is a Claude handoff record for the existing project. It is intentionally not a fabricated chronological Git history.

## Migration Baseline

- Existing application was developed with AI assistance using a Trae-based workflow.
- Claude Code is being introduced as the next development assistant.
- The application should be continued in-place rather than rewritten.
- Existing source code, SQL migrations, FBR behavior, and UI should be treated as the baseline.

## Existing Notable Features

- Multi-tenant company management
- JWT authentication and role-based access
- Sales invoice create/edit/list workflow
- FBR digital invoice integration
- FBR scenario mapping/validation
- Items, customers, vendors, purchases
- Reports/dashboard
- Invoice printing/PDF-related utilities
- Global input restrictions in `src/App.tsx`
- Advance tax, further tax, extra tax, discount and other invoice-item fields in the current implementation/migration history

## Changes

### 2026-10-26 - Optional product sub-description on sales invoice lines

Feature `001-invoice-sub-description`. One Item Master product can now be invoiced with line-specific variations ("Ink Roll" + "Size 30mm") without duplicating the catalogue record.

**Migration required**: `backend/database/add_sub_description_to_invoice_items.sql` adds `InvoiceItems.SubDescription NVARCHAR(255) NULL`. Guarded and rerunnable; no backfill. The API probes `sys.columns` for the column and degrades gracefully, so code and migration can be deployed in either order.

- `src/utils/invoiceDescription.ts` - new. `mergeProductDescription` (the `"name - variation"` rule), `normaliseSubDescription` (empty and whitespace-only collapse to null), `isMergedDescriptionTooLong`, and `MAX_PRODUCT_DESCRIPTION_LENGTH`.
- `src/pages/SalesInvoice.tsx` - optional Sub-Description input per line; value preserved through add, edit, save and reload; merged value shown in the Description column and sent to FBR; submission blocked when the merged value would exceed the limit.
- `src/components/SalesInvoiceReport.tsx` - merged description rendered in all four templates, covering preview, print and PDF.
- `backend/server.js` - `SubDescription` added to the four `sys.columns` probes, the four `InvoiceItems` SELECT lists, both camelCase read mappers, and both insert paths.
- `src/utils/fbrUtils.ts` - FBR item validation now enforces the description length as well as its presence.

**The constraint this design exists for.** Stock is derived, not stored: it is recomputed on every read by matching invoice lines to catalogue products on HS Code *and* product name, in four places (`/api/items`, the Inventory Report, `/api/dashboard/stats`, and `getAvailableStock` in the invoice editor). `InvoiceItems.ProductDescription` therefore still holds the catalogue product name alone - the merge happens only at display and submission. Writing the merged value there would silently stop sold quantities from counting and overstate stock. `src/utils/invoiceDescription.invariant.test.ts` guards this at the source level.

**FBR scenario detection deliberately reads the unmerged name.** `determineFbrScenario` substring-matches for "scrap", "steel" and similar; feeding it the merged value would let a free-text variation change which tax scenario is submitted.

**Deliberate non-change**: the Sales Register and Inventory Report continue to show the catalogue product name without the variation. The spec lists five output paths for the merged description and the registers are not among them.

**Known limitation**: `MAX_PRODUCT_DESCRIPTION_LENGTH` is 255, matching the column. FBR's own maximum for `productDescription` is not documented in this repository; if it differs, change that one constant.

Not verified: the migration has not been applied and no screen was exercised in a browser - no database was available. Typecheck, production build and the feature test suite (23 tests) pass.

### 2026-10-24 - Fix: "Payload too Large" when updating an invoice

Saving an invoice failed with a bare HTML page reading `Payload too Large`. The body parser was on its 100kb default; an invoice line item serialises to about 575 bytes, so any invoice past roughly 175 lines was rejected before it reached the route.

- `backend/server.js` - the JSON and urlencoded parsers were registered **twice**: `bodyParser.json()` on one line and `express.json()` a few lines below. `express.json` is body-parser, and the first registration wins because body-parser marks the request as parsed and the second call becomes a no-op. Raising the limit on `express.json()` alone therefore does nothing, which is the trap in this fix. The duplicate registration and the `body-parser` require were removed, leaving one parser configured at 5mb (several thousand line items).
- `backend/server.js` - body-parser reports failures as HTML, and `getErrorMessage` in the frontend falls back to returning the raw response text when it is not JSON, which is why the HTML reached the screen. A small error handler after the parsers now answers 413 and malformed-JSON 400 in JSON, so the UI shows a real message.

Verified by running both middleware stacks against a 400-line invoice (225kb): the old arrangement returns 413 HTML even with a 5mb limit added to `express.json`, the new one returns 200.

Worth knowing: an invoice large enough to have hit this has 175+ line items. FBR Digital Invoicing may impose its own limits on invoice size, which this change does not affect.

### 2026-10-24 - Rows-per-page dropdown: investigated, not reproduced

Reported: the rows-per-page dropdown does not hold a selection. Not reproducible from the code. What was checked:

- All five list pages (Items, Vendors, Customers, Invoices, Purchases) are wired identically: one `useTableControls`, rendering `controls.pageRows`, one `TablePaginationControls`. No page renders the unpaged `controls.rows`.
- No global handler can interfere. The only document-level listeners are the input restriction in `src/App.tsx` (keydown, beforeinput, paste, drop) and two window listeners for FBR error events. None touches mousedown or click, and the restriction treats only inputs, textareas and contenteditable as editable, so it does not see the select trigger or the menu options.
- Nothing resets `rowsPerPage`. The hook resets only `page`, and only on a search or sort change.

- `src/components/common/TablePaginationControls.test.tsx` - new test covering the reported behaviour: the dropdown holds a selection, holds a page size larger than the row count, keeps the selection while paging, and returns to page 1 when the size changes. It installs the same document-level keydown restriction App.tsx uses and renders under the real application theme. All pass.
- `src/theme.ts` - the MUI theme moved out of `src/App.tsx` so it can be imported by tests and anything else that needs it. No values changed; App.tsx now imports it.

If the problem persists it is environment- or data-specific rather than structural, so the next useful evidence is the browser console on an affected page.

### 2026-10-24 - Inventory Report driven by a From/To date range

The report had a single "As of" date. It now takes From and To, and the four quantity columns became a real movement statement for that period.

- Opening: stock carried into the period, i.e. the item's initial stock plus everything received and less everything invoiced *before* From. It was previously always `Items.InitialStock`, ignoring the date entirely.
- Purchased / Sold: movement *within* From..To, previously everything up to the as-of date.
- Balance: Opening + Purchased - Sold, so it closes the period and equals the stock standing at To.
- Value: Balance priced at the item's UnitPrice, so it values the stock at To.

With both dates blank the report is current stock and the figures are identical to before, which keeps it reconcilable against the Items page.

- `backend/server.js` - `GET /api/reports/inventory` takes `startDate`/`endDate` instead of `asOf`, and returns `period` instead of `asOf`. Two extra correlated subqueries compute movement before From, emitted only when From is supplied so an undated report does no extra work. `endDate` is an exclusive upper bound, so documents dated on the To date are included. A From on or after To is rejected with 400. All dates stay bound as parameters.
- `src/services/reportsApi.ts` - `getInventoryReport` takes the range; `InventoryData.asOf` became `period`.
- `src/pages/InventoryReport.tsx` - From and To fields, a period label matching the Sales and Purchase registers, and an export filename carrying the range.

Unchanged: sold quantities still match an item by HSCode plus ProductDescription, which is how `/api/items` derives stock. Renaming an item still detaches its sales history from it.

### 2026-10-24 - Purchases controls, and pagination on every list page

- `src/pages/Purchases.tsx` - search over CR number, PO number and vendor; status filter (pending / received / cancelled); six sortable columns. Date sorting uses the same `date -> poDate -> createdAt` fallback the table displays, so the order matches what is on screen.
- `src/hooks/useTableControls.ts` - the hook now owns pagination as well as search and sort, so the page state and its reset rules live in one place rather than being repeated per page. It returns `pageRows` for the table body and `rows`/`total` for counts.
- `src/components/common/TablePaginationControls.tsx` - the shared pager, with one set of rows-per-page options (5/10/25/50/100) for every list.
- Pagination added to `Purchases`, `Items`, `Customers` and `Vendors`; `Invoices` migrated onto the shared pager and its local page state removed.

Two rules in the hook, because the naive version of each is wrong:

- A new search or sort order resets to page 1, since the old page number means nothing against a different result set.
- Everything else clamps instead of resetting: if the list shrinks under you - a filter, a deletion - the view slides to the last page that still exists rather than jumping back to the first or rendering an out-of-range blank page.

### 2026-10-24 - Sorting, filtering and searching on the list pages

Items, Vendors, Customers and Invoices had no search, sort or filter. All four now share one implementation rather than four bespoke ones.

- `src/hooks/useTableControls.ts` - new hook handling search and column sort over a row set the page already holds, so nothing re-fetches when the controls change. Sorting is numeric-aware for text (HS codes order correctly), truly numeric for numbers, case-insensitive, and keeps blank values last in both directions so empty cells never lead the table. The input array is copied before sorting.
- `src/components/common/SortableTableCell.tsx` - header cell wired to the hook, so the sort affordance is identical on every page.
- `src/pages/Items.tsx` - search over HS code, description and UoM; filters for status and in/out of stock; nine sortable columns.
- `src/pages/Vendors.tsx` - search over name, NTN, CNIC, contact, email and phone; sector filter built from the sectors vendors actually carry; six sortable columns.
- `src/pages/Customers.tsx` - search over business name, NTN, CNIC, registration no, contact, email and phone; registration-type filter; eight sortable columns.
- `src/pages/Invoices.tsx` - search over invoice no, FBR no, buyer and type; FBR submitted/not-submitted filter; eight sortable columns. `TablePagination` now counts the filtered set rather than all invoices, and the page resets to the first page when the search, filter or sort changes - otherwise a narrowed result could leave the view parked past the end of the list.

Each toolbar shows a "N of M" count so a filtered view is never mistaken for the full list.

Pre-existing bug found and NOT changed: in `src/pages/Vendors.tsx` the first two column headers are swapped relative to the data under them - "CNIC/NTN" renders `vendorNTN` and "Registration No." renders `vendorCNIC`. Sorting was bound to the field each column actually displays, so sort matches what is on screen, but the labels remain wrong.

### 2026-10-23 - Fix: Items CSV import dropped UoM and Initial Stock

Importing items stored a truncated unit of measure and an initial stock of 0. The CSV writer quotes any value containing a comma, but the reader split each line on `,` with no notion of quoting. Exactly one UoM in the list contains commas - `Numbers, pieces, units` - and it is both the default and the value shipped in the import template, so most imports hit it. The row shattered into extra fields, UoM became `Numbers`, and every column after it shifted left, leaving InitialStock reading a non-numeric cell.

- `src/utils/formatUtils.ts` - new `parseCSV`, an RFC 4180 reader handling quoted fields, escaped quotes, CRLF, embedded newlines and a leading BOM. It is the counterpart to `buildCSVContent`, so anything the writer produces the reader now restores unchanged.
- `src/pages/Items.tsx` - the import uses `parseCSV`. Column lookup went through a `valueOf` helper: previously a missing header gave `indexOf` of -1 and read `values[-1]`, so a file without a UoM column sent an empty string, which the API rejects with 400 and the UI reported only as a generic error. A blank UoM now falls back to `Numbers, pieces, units`, matching the add-item form.
- `src/pages/Items.tsx` - the CSV export was missing the `UoM` and `InitialStock` columns entirely, so export -> edit -> import silently lost both. Both are now exported, and the column set mirrors the import template so an exported file can be edited and imported straight back.

Note: the export writes `InitialStock`, the opening figure, not current stock. Current stock is derived from purchases and invoices and is not an importable field.

Not fixed, same underlying bug: `src/pages/Customers.tsx` parses its import with the same naive `split(',')`. It can adopt `parseCSV` the same way.

### 2026-10-15 - UI restyle: Workday Canvas

Reskinned the application to resemble Workday ERP. The work is concentrated in the MUI theme and the layout chrome, so it reaches all pages without rewriting any of them. No page logic, data flow or business rule was touched.

- `src/App.tsx` - replaced the stock MUI theme with a Workday Canvas palette (`#0875E1` blue for action and selection, `#083A5E` navy chrome, `#FF9800` accent, Canvas greys for surfaces). Base font size 16 -> 14 for ERP density; headings moved to weight 500. Buttons are pill-shaped (`borderRadius: 999`), the Canvas signature. Surfaces are flat and bordered instead of shadowed: only `elevation1` is flattened, so menus and dialogs keep their shadow.
- `src/components/layout/MainLayout.tsx` - sidebar brand block is left-aligned with a blue app mark; the selected nav item carries a blue left rail plus a tinted row; the app-bar avatar is compact and blue. The app bar picks up the navy from the theme.
- `src/pages/SalesInvoice.tsx` - replaced four blue gradient washes with a flat navy band and let the save button inherit the theme. Canvas has no gradients, and these hardcoded the previous theme primary.

Known inconsistency, deliberately left alone: the Sales Register, Purchase Register and Inventory Report use a green table header (`#e2f0d9`) inline, which now sits outside the palette. It matches the fill used in those reports' PDF exports, so changing it on screen alone would desync the two.

Not visually verified - the restyle compiles and typechecks, but was not viewed in a browser.

### 2026-10-15 - Inventory Report: HS Code drill-down

The Inventory Report (by HS Code) is now interactive. Clicking an HS Code row expands it to list the individual items in that group.

- `backend/server.js` - `GET /api/reports/inventory` now selects one row per item and does the HS Code grouping in JS, instead of a SQL `GROUP BY`. Each group gained an `items[]` array carrying itemId, description, unit, unitPrice, opening, purchased, sold, balance and value. Tenant scoping, the `asOf` cutoffs and the stock formula are unchanged.
- `src/services/reportsApi.ts` - new `InventoryItemRow`; `InventoryRow` gained `items`.
- `src/pages/InventoryReport.tsx` - group rows are clickable and carry an expand chevron with `aria-expanded`; the detail table renders inside a `Collapse`. Expansion state is keyed by HS Code, so several groups can be open at once.

Because the group figures are now summed from the per-item rows rather than aggregated separately in SQL, a parent row always equals the sum of the children shown beneath it. This can differ from the previous output by a rounding unit on values.

The Excel and PDF exports are unchanged and still report at group level only.

### 2026-10-14 — Inventory Report (grouped by HS Code)

Added an Inventory Report to the Reports sub-menu: stock on hand aggregated by HS Code, with Excel and PDF export.

- `backend/server.js` — new `GET /api/reports/inventory`. Tenant-scoped by the authenticated user's `CompanyID` with the usual `X-Company-ID` override for Super Admin. Stock is derived as `InitialStock + purchases received - quantities invoiced`, the same expression `GET /api/items` uses, so the report, the Items page and the dashboard cannot disagree. Per-item figures are then grouped by `HSCode`. An optional `asOf` date is bound as a SQL parameter and applied to both the purchase and invoice legs; omitting it gives current stock.
- `src/pages/InventoryReport.tsx` — new page. One shared column definition drives the table, the Excel export and the PDF export. Columns: S. No, HS Code, Description, Items, Unit, Opening, Purchased, Sold, Balance, Value. A negative balance (oversold) is shown in red.
- `src/services/reportsApi.ts` — added `getInventoryReport` plus its types.
- `src/components/layout/MainLayout.tsx` — "Inventory Report" sub-item under Reports.
- `src/App.tsx` — new route `/reports/inventory`.

Notes: an HS Code can cover several items, so Description shows one of them, Items gives the count, and Unit reads "Mixed" when those items do not share a unit. Quantity totals are only shown when every group reports the same unit, since adding different units together would be meaningless; the Value total is always shown. Value is Balance at each item's `Items.UnitPrice`, not a purchase-cost basis.

### 2026-10-14 — Fix: Dashboard showed fabricated and mismatched data

Three of the Dashboard's panels did not reflect the company's real records.

- `backend/server.js` — `GET /api/dashboard/stats`:
  - **Recent activities** joined `Customers` on `i.CompanyID = c.CompanyID`. `Invoices` has no `CustomerID`, so this produced a cross join: every invoice paired with every customer in the company, meaning "last 10 invoices" was a handful of invoices repeated under arbitrary buyer names. The join is removed; the buyer now comes from `Invoices.BuyerBusinessName`, which is where the invoice records it.
  - **Inventory count and stock status** were read from the legacy `Inventory` table, which no screen in the application writes to. Stock actually lives in `Items` and is derived as `InitialStock + purchases received - quantities sold`. Both now use that same derivation, copied from `GET /api/items`, so the Dashboard and the Items page cannot disagree. Oversold items (negative stock) now count as out-of-stock instead of falling out of all three buckets.
  - Added a real `purchasesChart` series from `Purchases` for the same 12-month window, scoped like the Purchases page (`IsActive = 1`), dated by `COALESCE(Date, PODate, CreatedAt)` because `Date` is nullable.
- `src/pages/Dashboard.tsx` — the "Purchases" chart plotted `sales * 0.7` with the comment "Mock purchases as 70% of sales". It now plots the real `purchasesChart` series.
- `src/services/dashboardApi.ts` — added `purchasesChart` to `DashboardData`.

Note: the "Sale Excl. Tax" card is still `TotalAmount - TotalSalesTax`, which ignores further tax, extra tax and discount. `SUM(InvoiceItems.ValueSalesExcludingST)` would be exact. Left unchanged pending a decision, since it is a tax figure.

### 2026-10-05 — Allow "/" in address fields

Addresses such as "House #12, Flat 4/B" could not be typed or pasted: the global input restriction in `src/App.tsx` blocks `/` in every editable field. ("#" was never blocked — only `/` was actually rejected.)

- `src/App.tsx` — `hasBlockedChars` now takes the event target. An input marked `data-allow-slash="true"` is tested against a regex that omits `/`; everything else keeps the original rule. Quotes, backslash, carriage return and newline stay blocked everywhere, addresses included, and the Enter-key block is unchanged. Applied consistently across keydown, beforeinput, paste and drop.
- Address fields opted in via `inputProps={{ 'data-allow-slash': 'true' }}`: `src/pages/Customers.tsx`, `src/pages/Vendors.tsx`, `src/pages/CompanyManagement.tsx`, `src/pages/Invoices.tsx` (seller + buyer), `src/pages/SalesInvoice.tsx` (buyer), `src/components/sales/FBRInvoiceSubmission.tsx` (seller + buyer).

The vendor "Email Address" field was deliberately left alone — it is an email, not a postal address.

### 2026-09-17 — Purchase Register report

Added a Purchase Register report (detail of purchases, one row per purchase line item) with Excel and PDF export, modelled on the Sales Register.

- `backend/server.js` — new `GET /api/reports/purchase-register`. Tenant-scoped by the authenticated user's `CompanyID`, with the usual `X-Company-ID` override for Super Admin. Date range is bound as SQL parameters. `Items` and `Vendors` are joined on `CompanyID` as well as their IDs, so a stray ID cannot pull another tenant's master data into the register.
- `src/pages/PurchaseRegister.tsx` — new page. One shared column definition drives the on-screen table, the Excel export and the PDF export. Defaults to the current July–June fiscal year.
- `src/services/reportsApi.ts` — added `getPurchaseRegister` plus its types.
- `src/components/layout/MainLayout.tsx` — "Purchase Register" added to the Reports sub-menu.
- `src/App.tsx` — new route `/reports/purchase-register`.

Notes on where the figures come from, since `PurchaseItems` stores no tax of its own (only `PurchasePrice`, `PurchaseQty` and `TotalAmount`):

- Exc Value is `PurchaseItems.TotalAmount` (price × qty).
- Rate is `Items.PurchaseTaxValue`, the per-item purchase tax percentage from the item master. This is its first use in a calculation; it was previously only displayed on the Items page. If a vendor invoice was taxed at a rate other than the item master's, the register shows the master rate.
- S.Tax and Inc Value are derived from those two, rounded to 2 decimals per line.
- The grand total's Rate is the effective rate over the period (total S.Tax / total Exc Value), not a sum of the column. Quantity is not totalled because units differ line to line.
- Date is `COALESCE(Purchases.Date, PODate, CreatedAt)` and Invoice # is `CRNumber` falling back to `PONumber`, matching what the Purchases page displays. All `IsActive = 1` purchases are included regardless of `Status`.

### 2026-09-15 — Security: mock login backdoor (R3) and hardcoded JWT fallback

`POST /api/auth/login` granted a `SUPER_ADMIN` session to `admin` / `admin123` whenever `isDbConnected` was false. `connectToDatabase()` swallows its error and lets the server boot anyway, so any database outage in production silently opened an unauthenticated administrator login.

- `backend/server.js` — the mock login is now gated on `ALLOW_MOCK_LOGIN === "true"` and is ignored entirely when `NODE_ENV=production`. With it disabled, a login attempt during an outage returns 503 instead of a session. The response no longer names the mock credentials.
- `backend/server.js` — replaced all four `process.env.JWT_SECRET || "your_jwt_secret"` fallbacks with a single `jwtSecret`. When `JWT_SECRET` is absent the process now generates a random secret and logs a warning, rather than signing and verifying tokens with a value published in the source. Behaviour is unchanged when `JWT_SECRET` is set.
- `backend/server.js` — the login handler no longer logs the submitted password length.
- `backend/.env.example` — documents `ALLOW_MOCK_LOGIN`.

### 2026-09-15 — Security: SQL injection in sales reports (R4)

The `dateRange=custom` branch of `GET /api/reports/sales` interpolated the request's `startDate` and `endDate` directly into the statement. Both are now bound as parameters; this was corrected as part of the sales report fix above. Validation was additionally moved ahead of the database-availability check so an invalid or hostile value is rejected with 400 whether or not the database is reachable.

### 2026-09-15 — Fix: FBR compliance reports returned HTML instead of JSON

The FBR Compliance Summary, FBR Scenario Usage and FBR Compliance Trends tabs failed with `Unexpected token '<', "<!doctype "... is not valid JSON`.

- `src/pages/Reports.tsx` — the three FBR report calls used relative URLs (`/api/reports/...`) while the rest of the app goes through `API_BASE_URL`. With no `proxy` set in `package.json` the requests were served by the static host, which returned `index.html` for the unknown path. They now use `API_BASE_URL` like every other call.
- `backend/server.js` — the three FBR report handlers bound `companyId` as `sql.Int`, but `CompanyID` is a `UNIQUEIDENTIFIER`. Every query would have failed conversion once the requests actually reached the API. Changed to `sql.UniqueIdentifier` (5 bindings).
- `backend/server.js` — the same three handlers use the global connection without checking it exists, returning an opaque 500 when the database is down. They now return 503 with a clear message, matching the other report endpoints.

### 2026-09-15 — Fix: Reports & Analytics returned HTTP 500

"Generate" on the Reports page failed for every date range. `GET /api/reports/sales` referenced four columns that do not exist in the schema, so SQL Server rejected the top-products and top-customers queries and the handler returned 500.

- `backend/server.js` — `GET /api/reports/sales`:
  - `InvoiceItems.ProductName` -> `ProductDescription`, and `InvoiceItems.TotalAmount` -> `TotalValues` (the per-item column that sums to `Invoices.TotalAmount`).
  - Removed `INNER JOIN Customers c ON i.CustomerID = c.CustomerID`. `Invoices` has no `CustomerID` column, so the buyer name is read from `Invoices.BuyerBusinessName` instead.
  - Wrapped both percentage denominators in `NULLIF(..., 0)` so a company with no invoices in the period no longer triggers a divide-by-zero error.
  - The custom date range is now bound as SQL parameters instead of being interpolated into the statement, and an invalid date returns 400.

Note: the percentage denominator is now scoped to the reported period, so shares sum to 100% within the selected range. It was previously written against the all-time company total, but that query never executed successfully.

### 2026-09-15 — Sales Register report

Added a Sales Register report (detail of sales, one row per invoice line item) with Excel and PDF export.

- `backend/server.js` — new `GET /api/reports/sales-register`. Tenant-scoped by the authenticated user's `CompanyID`, with the usual `X-Company-ID` override for Super Admin. Date range is bound as SQL parameters. Probes `sys.columns` for `Buyer_NTN` / `Buyer_NIC` and falls back to `BuyerNTNCNIC` on older databases.
- `src/pages/SalesRegister.tsx` — new page. One shared column definition drives the on-screen table, the Excel export and the PDF export. Defaults to the current July–June fiscal year.
- `src/services/reportsApi.ts` — added `getSalesRegister` plus its types; `getAuthHeaders` now accepts an optional company ID.
- `src/components/layout/MainLayout.tsx` — `NavItem` gained an optional `children` array, rendered as a collapsible sub-menu. Reports now has a "Sales Register" sub-item.
- `src/App.tsx` — new route `/reports/sales-register`.

Notes: the "Term" and "Party Code" columns have no backing column in the current schema and render empty. The register's "Rate" column is unit price (`ValueSalesExcludingST / Quantity`), not `InvoiceItems.Rate`, which stores the tax rate as text.

### 2026-09-15 — Security: FBR token endpoint authorization

`requireCompanyAccess` resolved the target company from `req.params.companyId`, but the three FBR token routes are declared as `/api/companies/:id/fbr-token`. The lookup returned `undefined` and the ownership check was skipped, so any authenticated user could read, overwrite or delete any other company's FBR bearer token.

- `backend/server.js` — resolve the company from `:id` as well as `:companyId`, fail closed when it cannot be resolved, compare IDs case-insensitively, and re-check ownership inside each of the three handlers. Super Admin cross-company access unchanged.

### 2026-09-15 — Security: stop tracking .env files

`.env` and `backend/.env` were tracked despite being listed in `.gitignore`. Both were untracked (files left on disk) and `.env.example` templates added. The previously committed `DB_PASSWORD` and `JWT_SECRET` remain in git history and require rotation.

## Important

When a future change is requested, add a concise dated entry here describing the actual implemented change and affected files. Do not invent historical entries.
