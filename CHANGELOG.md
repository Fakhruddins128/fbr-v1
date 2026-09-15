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
