# FBR Multi-Tenant SaaS Platform

A multi-tenant Software-as-a-Service (SaaS) application for centralized management of company accounts with integrated digital invoicing for Pakistan's Federal Board of Revenue (FBR).

## 🚀 Key Features

- **Multi-Tenant Architecture**: Shared database with row-level data isolation for multiple companies.
- **FBR Digital Invoicing**: Real-time invoice submission and validation with FBR Pakistan.
- **Sales & Purchases**: Complete management of sales invoices and purchase records.
- **Inventory & Items**: Master list management for items, including HS Codes and UoM.
- **Role-Based Access Control (RBAC)**: Secure access for Super Admins, Company Admins, and specialized roles.
- **Reporting**: Comprehensive reports for business analytics.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material UI v5, Redux Toolkit
- **Backend**: Node.js, Express, MSSQL (SQL Server)
- **Database**: Microsoft SQL Server
- **Integration**: FBR API (Sandbox & Production)

## 📚 Detailed Documentation

For in-depth information about the project, please refer to the following guides:

- **[System Architecture](./docs/ARCHITECTURE.md)**: High-level overview and multi-tenancy model.
- **[Project Flow](./docs/PROJECT_FLOW.md)**: Detailed user and data workflows.
- **[Setup Guide](./docs/SETUP_GUIDE.md)**: Step-by-step instructions to get the project running locally.
- **[API Reference](./docs/API_REFERENCE.md)**: Documentation for backend RESTful endpoints.
- **[Database Schema](./docs/DATABASE_SCHEMA.md)**: Detailed tables and relationship diagrams.
- **[FBR Integration Guide](./docs/FBR_INTEGRATION.md)**: Specifics on the FBR invoicing workflow and validation logic.
- **[Frontend Guide](./docs/FRONTEND_GUIDE.md)**: Overview of React components, state management, and key pages.

## 🏁 Quick Start

### Backend
1.  Navigate to `backend/`.
2.  Run `npm install`.
3.  Configure your `.env` file (see [Setup Guide](./docs/SETUP_GUIDE.md)).
4.  Run `npm run dev`.

### Frontend
1.  Run `npm install` in the root directory.
2.  Run `npm start`.
3.  Open `http://localhost:3000` in your browser.

## 📄 License

This project is proprietary and for internal use only.
