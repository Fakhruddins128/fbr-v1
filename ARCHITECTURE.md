# Architecture — Claude Working Reference

## Frontend

The frontend is a Create React App TypeScript SPA.

```text
src/
├── api/          API-specific clients
├── components/   reusable UI
├── hooks/        React/Redux hooks
├── pages/        route/page modules
├── services/     higher-level API/business services
├── store/        Redux Toolkit
├── types/        shared TypeScript types
└── utils/        calculations/validation/formatting/FBR helpers
```

Routing is configured in `src/App.tsx` using React Router. Protected application routes are wrapped by `PrivateRoute` and rendered through `MainLayout`.

Global providers currently include Redux, Material UI theme, FBR error provider, and router.

## State Management

Redux Toolkit store currently includes:

- `auth`
- `fbr`
- `company`

When adding state, first determine whether it belongs in an existing slice or should remain local component state.

## Backend

The backend uses Express routes in `backend/server.js`. Authentication middleware establishes the user context, including role/company information. Database operations use SQL Server through `mssql`.

## Data Flow

Typical sales invoice flow:

```text
SalesInvoice.tsx
   -> invoice API/service
   -> Express endpoint
   -> SQL Server

Invoices.tsx
   -> submit invoice
   -> Express
   -> load invoice + items
   -> transform to FBR payload
   -> FBR API
   -> persist FBR result
   -> frontend status/error handling
```

## Tenant Boundary

The company ID is a security boundary, not merely a UI filter. Every backend data access path affecting tenant-owned records must enforce the authenticated user's permitted company context.

## Database

Microsoft SQL Server is the system of record. SQL setup and migration files are distributed under `backend/database/`, `backend/migrations/`, and `database/schema/`.

## Change Strategy

Prefer incremental changes that fit the existing architecture. Avoid large rewrites unless explicitly requested.
