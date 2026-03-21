# Project Flow Guide

This document outlines the core user workflows and data flows within the FBR SaaS platform.

## 1. User Onboarding & Authentication Flow

How a new company and its users are introduced to the system.

1.  **Super Admin Action**: Logs in to the Super Admin dashboard.
2.  **Company Creation**: Navigates to **Company Management** and creates a new company (NTN, address, sector).
3.  **User Provisioning**: Super Admin creates the first **Company Admin** user for that company.
4.  **Company Admin Action**: Logs in, then uses **User Management** to create additional roles (Accountant, Sales Person).
5.  **Session Management**: JWT is issued on login and stored in `localStorage`, authorizing subsequent API requests.

## 2. Item Master List Management Flow

Establishing the catalog of products/services before invoicing.

1.  **Navigation**: User goes to the **Items** page.
2.  **Data Entry**: Clicks "Add Item" and enters:
    - **HS Code**: Standard 8-digit tariff code.
    - **Description**: Product name (e.g., "PULIMAK 2").
    - **UoM**: Unit of Measurement (e.g., "KG", "PCS").
    - **Sales Tax Rate**: Default rate (e.g., "18%").
3.  **Persistence**: Data is saved to the `Items` table in the database, associated with the `CompanyID`.
4.  **Availability**: These items now appear in the dropdowns when creating sales invoices.

## 3. Sales Invoice & FBR Submission Flow

The core business process of the application.

### Phase A: Invoice Creation
1.  **Navigation**: User goes to **Sales Invoice**.
2.  **Buyer Info**: Enters Buyer NTN/CNIC; system identifies if they are "Registered" or "Unregistered".
3.  **Item Selection**: User selects an item from the HS Code dropdown (e.g., `3402.9000 - PULIMAK 2`).
4.  **Auto-Calculation**: System fetches the default rate/UoM and calculates `Sales Tax` and `Total Value` in real-time.
5.  **Save Item**: User adds the line item to the invoice table.
6.  **Save Invoice**: User clicks "Save Invoice". Data is sent to `POST /api/invoices` and stored in `Invoices` and `InvoiceItems` tables.

### Phase B: FBR Submission
1.  **Navigation**: User goes to the **Invoices** list.
2.  **Initiation**: Clicks the **"Submit to FBR"** button for a specific invoice.
3.  **Backend Processing**:
    - Backend retrieves the invoice and all its line items from the database.
    - Transforms data into the strict FBR JSON format (ensuring numeric fields for taxes).
    - Forwards the request to FBR's `postinvoicedata` API using the company's FBR token.
4.  **Response Handling**:
    - **Success**: FBR returns a `FBRInvoiceNumber`. Backend updates the invoice record with this number and sets status to "Success".
    - **Error**: FBR returns validation errors (e.g., "Requested JSON in Malformed"). System displays these errors via `FBRErrorModal`.
5.  **Finalization**: Once an invoice has an `FBRInvoiceNumber`, it is locked and cannot be edited or deleted.

## 4. Purchase Recording Flow

Managing the inventory/input side of the business.

1.  **Navigation**: User goes to the **Purchases** page.
2.  **Vendor Selection**: Selects a vendor (or adds a new one in **Vendors** page).
3.  **Data Entry**: Enters the purchase date, invoice number, and item details.
4.  **Persistence**: Data is saved to the `Purchases` table.
5.  **Impact**: These records are used to calculate input tax credits and track inventory levels.

## 5. Reporting & Analytics Flow

How data is summarized for business owners.

1.  **Data Aggregation**: The **Reports** page calls backend endpoints that run aggregate SQL queries (e.g., `SUM(TotalAmount)` grouped by month).
2.  **Visualization**: Frontend uses **Chart.js** to display sales trends and tax liabilities on the **Dashboard**.
3.  **Export**: Users can export filtered reports to **PDF** (via jspdf) or **Excel** (via xlsx) for tax filing or internal audits.
