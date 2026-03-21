# FBR Integration Details

The FBR integration allows companies to submit sales invoices to Pakistan's Federal Board of Revenue in real-time.

## API Endpoints

- **Sandbox API**: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb`
- **Production API**: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata`

The backend `server.js` manages the submission based on the `FBR_API_ENVIRONMENT` environment variable.

## Data Transformation and Validation

Before sending an invoice to FBR, the application transforms it into the required JSON format. Key requirements include:

1.  **Numeric Fields**: Taxes (`extraTax`, `furtherTax`, `salesTax`) must be sent as numbers, not empty strings. If empty, they should default to `0`.
2.  **Date Format**: The `invoiceDate` must follow the standard ISO 8601 format or FBR's expected format.
3.  **HS Code Format**: The `hsCode` is a specific 8-digit or similar formatted code (e.g., `3402.9000`).
4.  **NTN/CNIC**: Valid registration numbers for both the seller (company) and buyer are required.

## Key Logic and Workflows

### HS Code Matching Logic
The application manages a company's master list of items (`src/pages/Items.tsx`). When creating a sales invoice:
1.  Users select an item from the master list.
2.  The `hsCodeDescription` is formed by concatenating the HS Code and the item description (e.g., `3402.9000 - PULIMAK 2`).
3.  When an invoice is reopened for editing, the system reconstructs the `hsCodeDescription` from the stored `hsCode` and `productDescription` to ensure the correct item is identified even if multiple items share the same HS Code.

### FBR Payload Structure
The `src/pages/SalesInvoice.tsx` file contains the logic for building the FBR payload. The structure includes:
- **Seller Info**: NTN, Name, Province, etc.
- **Buyer Info**: NTN/CNIC, Name, Registration Type, etc.
- **Invoice Metadata**: Type, Date, Number, etc.
- **Items Array**: List of items with their HS Codes, quantities, values, and tax calculations.

### Error Handling
The `src/components/common/FBRErrorHandler.tsx` and `FBRErrorModal.tsx` components provide user-friendly error messages when FBR returns a validation or processing error (e.g., "Requested JSON in Malformed").
- Common issues like malformed JSON are handled by ensuring all numeric fields are correctly typed.
- FBR response codes (success or specific error codes) are displayed and logged for troubleshooting.
