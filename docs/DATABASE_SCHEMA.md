# Database Schema

The database for the FBR SaaS application is hosted on Microsoft SQL Server and follows a relational schema with a focus on multi-tenancy.

## Core Tables

### `Companies`
Stores details about the companies registered in the SaaS platform.
- `CompanyID` (Primary Key, UNIQUEIDENTIFIER)
- `Name` (NVARCHAR(255))
- `NTNNumber` (NVARCHAR(50))
- `Address` (NVARCHAR(MAX))
- `BusinessActivity` (NVARCHAR(255))
- `Sector` (NVARCHAR(255))
- `CreatedAt` (DATETIME)
- `UpdatedAt` (DATETIME)

### `Users`
Stores user accounts for authentication and role-based access.
- `UserID` (Primary Key, UNIQUEIDENTIFIER)
- `CompanyID` (Foreign Key to `Companies.CompanyID`, UNIQUEIDENTIFIER)
- `Username` (NVARCHAR(50), UNIQUE)
- `PasswordHash` (NVARCHAR(255))
- `Role` (NVARCHAR(20)) - e.g., 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT'
- `CreatedAt` (DATETIME)

### `Invoices`
Stores metadata for sales invoices.
- `InvoiceID` (Primary Key, UNIQUEIDENTIFIER)
- `CompanyID` (Foreign Key to `Companies.CompanyID`, UNIQUEIDENTIFIER)
- `InvoiceNumber` (NVARCHAR(50))
- `InvoiceType` (NVARCHAR(50))
- `InvoiceDate` (DATETIME)
- `BuyerNTNCNIC` (NVARCHAR(50))
- `TotalAmount` (DECIMAL(18, 2))
- `TotalSalesTax` (DECIMAL(18, 2))
- `FBRInvoiceNumber` (NVARCHAR(50), NULL) - Returned by FBR after successful submission
- `FBRResponseStatus` (NVARCHAR(10), NULL)
- `CreatedAt` (DATETIME)
- `CreatedBy` (Foreign Key to `Users.UserID`, UNIQUEIDENTIFIER)

### `InvoiceItems`
Stores line items for each sales invoice.
- `ItemID` (Primary Key, UNIQUEIDENTIFIER)
- `InvoiceID` (Foreign Key to `Invoices.InvoiceID`, UNIQUEIDENTIFIER)
- `HSCode` (NVARCHAR(20))
- `ProductDescription` (NVARCHAR(255))
- `Rate` (NVARCHAR(20))
- `Quantity` (DECIMAL(18, 2))
- `ValueSalesExcludingST` (DECIMAL(18, 2))
- `SalesTaxApplicable` (DECIMAL(18, 2))
- `TotalValues` (DECIMAL(18, 2))

### `Items`
Company-specific master list of items for quick invoice creation.
- `ItemID` (Primary Key, UNIQUEIDENTIFIER)
- `CompanyID` (Foreign Key to `Companies.CompanyID`, UNIQUEIDENTIFIER)
- `HSCode` (NVARCHAR(20))
- `Description` (NVARCHAR(255))
- `UnitPrice` (DECIMAL(18, 2))
- `SalesTaxValue` (DECIMAL(18, 2))
- `UoM` (NVARCHAR(20))

## Relationships

- `Users` belong to one `Company`.
- `Invoices` belong to one `Company`.
- `Invoices` are created by one `User`.
- `InvoiceItems` belong to one `Invoice`.
- `Items` belong to one `Company`.
- `FBRApiTokens` (if implemented) belong to one `Company`.
