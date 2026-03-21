# System Architecture

This project is a multi-tenant Software-as-a-Service (SaaS) application designed for centralized management of multiple independent company accounts, with a focus on FBR (Federal Board of Revenue) Pakistan integration for digital invoicing.

## High-Level Overview

The application follows a standard Client-Server architecture:

- **Frontend**: A React-based Single Page Application (SPA) that provides a modern UI for company admins and users.
- **Backend**: A Node.js and Express server that handles business logic, authentication, and communication with the database and FBR APIs.
- **Database**: A Microsoft SQL Server database using a shared-schema, shared-database approach with row-level data isolation.

## Multi-Tenancy Model

The application uses a **Shared Database, Shared Schema** architecture. Each record in shared tables (Invoices, Items, Users, etc.) includes a `CompanyID` (Tenant ID) to logically separate and secure data per company.

### Data Isolation
Row-level data isolation is enforced at the API layer:
1.  Users are assigned a `CompanyID` upon login.
2.  Backend middleware (`requireCompanyAccess`) ensures that users can only access records associated with their `CompanyID`.
3.  Super Admins have special permissions to access and manage all companies.

## FBR Integration Workflow

The core feature of the application is its integration with Pakistan's FBR for digital invoicing.

1.  **Invoice Creation**: Users create a sales invoice in the React frontend.
2.  **Validation**: The frontend and backend validate the invoice data against FBR's JSON schema requirements (e.g., numeric fields for taxes, specific HS Code formats).
3.  **Submission**: The backend server forwards the validated invoice to the FBR API (Sandbox or Production).
4.  **Response Handling**: The FBR response (success/error) is processed and displayed to the user, and the invoice status is updated in the database.

## Technology Stack

### Frontend
- **React 18**: UI Library
- **TypeScript**: Type safety and better developer experience
- **Material UI (MUI) v5**: Component library for a modern, responsive design
- **Redux Toolkit**: Centralized state management for authentication, company data, and FBR status
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MSSQL (node-mssql)**: Driver for Microsoft SQL Server
- **JWT (jsonwebtoken)**: Secure authentication and session management
- **bcrypt**: Secure password hashing

### Database
- **Microsoft SQL Server**: Robust, enterprise-grade relational database
- **SQL Scripts**: Migration and setup scripts for table creation and data seeding
