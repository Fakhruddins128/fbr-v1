# Project Context — FBR Multi-Tenant SaaS Platform

## Overview

FBR Multi-Tenant SaaS is a React/TypeScript + Node/Express + Microsoft SQL Server application for managing multiple companies and submitting digital sales invoices to Pakistan's Federal Board of Revenue (FBR).

## Current Architecture

```text
React SPA
  |
  | HTTP/JSON
  v
Node.js + Express API
  |
  +---- Microsoft SQL Server
  |
  +---- FBR Digital Invoicing API
```

## Main Frontend Modules

- Login
- Dashboard
- Company Management
- User Management
- FBR Integration
- Sales Invoice
- Invoice listing
- Purchases
- Items
- Customers
- Vendors
- Reports
- Scenario Management

## Important Frontend Files

- `src/App.tsx` — routing, theme, global input restrictions, providers
- `src/pages/SalesInvoice.tsx` — central sales invoice creation/editing/FBR payload logic
- `src/pages/Invoices.tsx` — invoice listing and FBR submission workflow
- `src/store/slices/authSlice.ts` — authentication state and localStorage session
- `src/store/slices/companySlice.ts` — company context
- `src/store/slices/fbrSlice.ts` — FBR-related state
- `src/services/api.ts` — API configuration
- `src/services/invoiceApi.ts` — invoice API operations
- `src/utils/fbrUtils.ts` — FBR-related utility logic
- `src/utils/scenarioValidation.ts` — scenario validation
- `src/utils/scenarioMapping.ts` — scenario mapping
- `src/components/sales/FBRInvoiceSubmission.tsx` — FBR submission UI/workflow
- `src/components/common/FBRErrorHandler.tsx` — FBR error handling
- `src/components/common/FBRErrorModal.tsx` — FBR error presentation

## Backend

The backend is currently concentrated in `backend/server.js`, with supporting scripts and SQL migrations under `backend/database/` and `backend/migrations/`.

Authentication uses JWT. SQL Server access uses the `mssql` package. FBR communication uses Axios.

## Multi-Tenancy

The system uses a shared database/shared schema model. Company-specific records contain `CompanyID` and backend authorization uses the authenticated user's company context. Super Admin can perform selected cross-company operations.

Any new endpoint that reads/writes tenant data must be reviewed for tenant isolation.

## Authentication

The frontend stores authentication information in localStorage under keys including:

- `auth_token`
- `token`
- `user`
- `selectedCompanyId` (used in company-selection/cross-company workflows)

Do not change these keys casually because existing frontend/backend flows may depend on them.

## FBR Integration

FBR endpoints documented by the project include sandbox and production digital invoicing endpoints. Environment selection is controlled through backend environment configuration.

FBR-related changes must consider:

- seller information
- buyer NTN/CNIC and registration type
- invoice type/date/reference
- scenario ID
- HS code and item description
- UoM
- quantity
- value excluding sales tax
- sales tax
- further tax
- extra tax
- advance tax
- FED
- discount
- SRO information
- FBR response/status/invoice number

## Known Documentation Drift

The root README and some older docs describe React 18 and MUI v5, while the current root `package.json` uses React 19.x and MUI 7.x. Treat the package manifest and source imports as authoritative.

The project also contains compatibility-style database column detection in backend invoice queries. Before assuming a column is always present, inspect the current database migration state.
