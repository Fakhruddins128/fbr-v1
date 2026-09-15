# CLAUDE.md — FBR Multi-Tenant SaaS Platform

## Purpose

This file is the primary project instruction/context file for Claude Code. Read it before modifying the project.

This is an existing production-oriented FBR Pakistan multi-tenant SaaS application. The project was previously developed with AI assistance (including Trae AI). **Do not rewrite or re-architect the application simply to make it "Claude-style".** Claude should continue the existing implementation unless the user explicitly requests a refactor.

## Read Before Coding

Read these files first when relevant:

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `BUSINESS_RULES.md`
- `API_DOCUMENTATION.md`
- `DATABASE.md`
- `CHANGELOG.md`
- Existing documentation under `docs/`

Then inspect the actual source code and verify documentation against implementation. The source code is authoritative when documentation conflicts with implementation.

## Project Structure

- `src/` — React + TypeScript frontend
- `src/pages/` — page-level modules
- `src/components/` — reusable UI components
- `src/components/layout/` — application layout
- `src/components/common/` — shared error/utility UI
- `src/services/` — higher-level API/business services
- `src/api/` — API-specific clients
- `src/store/` — Redux Toolkit store and slices
- `src/utils/` — calculations, validation, formatting, FBR helpers
- `src/types/` — shared TypeScript types
- `backend/` — Node.js + Express API
- `backend/database/` — SQL Server setup/migration scripts
- `database/schema/` — additional database/schema SQL
- `docs/` — existing project documentation

## Current Technology — Verify Before Changing

Frontend:
- React 19.x
- TypeScript
- Create React App / `react-scripts` 5
- Material UI 7.x
- Redux Toolkit 2.x / React Redux 9.x
- React Router 7.x
- Axios
- Chart.js / Recharts
- jsPDF / XLSX

Backend:
- Node.js
- Express 4.x
- Microsoft SQL Server via `mssql`
- JWT authentication
- bcrypt password hashing
- Axios for FBR communication

Do not rely on older documentation that says React 18 or MUI 5 without checking `package.json` and actual imports.

## Critical Business Rules

1. The application is multi-tenant.
2. Shared database/shared schema is used with `CompanyID` tenant isolation.
3. Normal company users must only access their own company's records.
4. Super Admin has elevated cross-company management capabilities.
5. Backend authorization and tenant filtering must not be weakened when modifying endpoints.
6. Sales invoices integrate with Pakistan FBR Digital Invoicing APIs.
7. FBR payload types and field formats are important; do not casually change numeric/string handling.
8. An invoice successfully assigned an FBR invoice number should be treated as finalized/locked according to existing business logic.
9. Existing invoice calculations, tax rules, scenario mapping, and FBR validation must be preserved unless the user explicitly asks for a change.
10. Existing database migration scripts are part of the application's history. Do not delete or rewrite migrations merely to simplify development.

## Security Rules

- Never commit `.env` files, tokens, passwords, JWT secrets, or database credentials.
- Do not expose secrets in source code, logs, documentation, generated examples, or commits.
- Use parameterized SQL queries.
- Preserve authentication middleware and company-level authorization.
- Do not disable CORS/authentication/tenant checks just to make local development easier.

## Input Validation Rule

The application currently implements a global editable-input restriction in `src/App.tsx`:
- Enter is blocked in editable inputs/textareas/content-editable fields.
- Single quote `'`, double quote `"`, backslash `\\`, slash `/`, carriage return, and newline are blocked during keyboard input.
- The same restrictions are applied to before-input, paste, and drop operations.

Do not remove or weaken this behavior unless the user explicitly requests it. If a legitimate field requires an exception, implement a narrowly scoped exception rather than removing the global protection.

## Coding Rules

- Make the smallest safe change needed for the user's request.
- Preserve existing naming conventions and API contracts unless change is required.
- Inspect related frontend, backend, and SQL code before changing a cross-layer feature.
- For a database change, provide/update the corresponding SQL migration script.
- For an API change, update the backend and the relevant frontend service/API client and documentation.
- For an invoice/FBR change, inspect calculations, database fields, payload construction, validation, and display/print/report paths.
- Do not silently change business calculations.
- Do not introduce a new framework or state-management library without explicit approval.
- Avoid broad formatting-only changes that make code review difficult.

## Before Implementing a Request

1. Identify affected files.
2. Search for all usages of the affected field/function/route.
3. Inspect the database schema/migrations if data is involved.
4. Check existing business rules and FBR requirements.
5. Implement the smallest complete change.
6. Run the relevant TypeScript/build/tests when possible.
7. Report exactly what changed and any remaining issue.

## Verification

Frontend commands:

```bash
npm install
npm start
npm run build
npm test
```

Backend commands:

```bash
cd backend
npm install
npm start
npm run dev
```

Do not run destructive database commands without explicit user approval.

## Git / Existing Work

The ZIP supplied for migration contains an existing `.git` directory in the original project, but the Claude-ready distribution should not require or redistribute Git internals. Preserve source history only in the user's actual Git repository.

## Important Instruction

**Do not make code changes just because you found an inconsistency.** First report inconsistencies that could affect the requested task. Only fix unrelated issues when explicitly asked.
