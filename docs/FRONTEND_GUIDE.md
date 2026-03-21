# Frontend Guide

The frontend is a React application using TypeScript and Material UI.

## Structure

- `src/api/`: API client services (e.g., `itemsApi.ts`, `userApi.ts`).
- `src/components/`: Reusable components (common UI elements, layouts, and providers).
- `src/pages/`: Page-level components (Login, Dashboard, SalesInvoice, etc.).
- `src/store/`: Redux state management (auth, company, fbr slices).
- `src/services/`: Business logic and higher-level API services (e.g., `invoiceApi.ts`).
- `src/utils/`: Helper functions (formatting, validation, FBR-specific utilities).
- `src/types/`: TypeScript interface and type definitions.

## Key Pages

### `SalesInvoice.tsx`
The most complex page in the application. It handles:
- Creating and editing sales invoices.
- Selecting items from the company's master list.
- Automatically calculating taxes and totals.
- Rebuilding HS Code descriptions when loading existing invoices.
- Preparing the invoice payload for submission to FBR.

### `Invoices.tsx`
Lists all sales invoices for the company. Users can view, edit, delete, or submit invoices to FBR from here.

### `Items.tsx`
Manages the company's master list of items (products/services), including their HS Codes, descriptions, and standard tax rates.

### `CompanyManagement.tsx` (Super Admin only)
Allows super admins to create and manage independent company accounts.

## State Management (Redux)

- **Auth Slice**: Manages the logged-in user's state, role, and authentication token.
- **Company Slice**: Manages the current company's metadata and settings.
- **FBR Slice**: Tracks the status of FBR submissions and associated response data.

## Theme and UI

The application uses Material UI (MUI) v5 with a customized theme. The layout is responsive and provides a professional dashboard-style interface.
- `src/components/layout/MainLayout.tsx`: The primary layout wrapper for all pages.
- `src/App.tsx`: Sets up the routing and global providers (Theme, Redux, FBR Error Handling).
