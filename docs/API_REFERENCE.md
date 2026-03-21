# API Reference

The backend server provides a RESTful API for authentication, company management, invoicing, and FBR integration.

## Authentication

### `POST /api/auth/login`
Authenticates a user and returns a JSON Web Token (JWT).
- **Request Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "success": true, "token": "...", "user": { "id": "...", "username": "...", "role": "...", "companyId": "..." } }`

---

## Companies

### `GET /api/companies`
Returns all companies in the system (Super Admin only).
- **Authentication**: JWT token in the `Authorization` header.

### `POST /api/companies`
Creates a new company in the system (Super Admin only).
- **Authentication**: JWT token in the `Authorization` header.
- **Request Body**: `{ "name": "...", "ntnNumber": "...", "address": "...", ... }`

---

## Invoices

### `GET /api/invoices`
Returns all invoices for the authenticated user's company.
- **Authentication**: JWT token in the `Authorization` header.

### `GET /api/invoices/:id`
Returns a single invoice by its ID.
- **Authentication**: JWT token in the `Authorization` header.

### `POST /api/invoices`
Creates a new sales invoice.
- **Authentication**: JWT token in the `Authorization` header.
- **Request Body**: 
  ```json
  {
    "invoiceType": "...",
    "invoiceDate": "...",
    "buyerNTNCNIC": "...",
    "items": [
      {
        "hsCode": "...",
        "productDescription": "...",
        "rate": "...",
        "quantity": 0,
        ...
      }
    ],
    ...
  }
  ```

### `PUT /api/invoices/:id`
Updates an existing sales invoice.
- **Authentication**: JWT token in the `Authorization` header.

### `DELETE /api/invoices/:id`
Deletes a sales invoice.
- **Authentication**: JWT token in the `Authorization` header.

---

## Items (Master List)

### `GET /api/items`
Returns all items in the company's master list.
- **Authentication**: JWT token in the `Authorization` header.

### `POST /api/items`
Adds a new item to the master list.
- **Authentication**: JWT token in the `Authorization` header.

### `PUT /api/items/:id`
Updates an existing item.
- **Authentication**: JWT token in the `Authorization` header.

### `DELETE /api/items/:id`
Deletes an item from the master list.
- **Authentication**: JWT token in the `Authorization` header.

---

## FBR Integration

### `POST /api/fbr/invoice`
Submits a sales invoice to the FBR API.
- **Authentication**: JWT token in the `Authorization` header.
- **Request Body**: `{ "invoiceId": "..." }`
- **Logic**: The backend retrieves the invoice from the database, validates it, and forwards it to the FBR's `postinvoicedata` or `postinvoicedata_sb` endpoint.
