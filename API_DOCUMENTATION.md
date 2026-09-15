# API Documentation — Claude Working Reference

The backend exposes REST endpoints under `/api` from `backend/server.js`.

## Authentication

Login is performed through the authentication API and returns a JWT plus user information. The frontend persists the session in localStorage.

## Invoice APIs

Known invoice operations include:

- `GET /api/invoices` — retrieve invoices permitted for the current user/company context.
- `GET /api/invoices/:id` — retrieve a specific invoice and its items with company authorization.
- `POST /api/invoices` — create an invoice and persist its line items.

The backend invoice implementation dynamically checks for certain optional/introduced columns such as `MasterItemID`, `AdvanceTaxRate`, `AdvanceTaxValue`, `Discount`, `SaleType`, and `SROItemSerialNo`. This indicates migration compatibility logic and must be preserved unless the database is deliberately standardized.

## FBR Submission

FBR submission is handled by backend logic after loading the invoice and converting it into the FBR payload. Exact route names and payload details must be confirmed in the current `backend/server.js` before modifying them.

## API Change Rule

Before changing an API:

1. Find the backend route.
2. Find all frontend callers.
3. Check request/response field naming.
4. Check authentication and `CompanyID` enforcement.
5. Update documentation if the contract changes.
