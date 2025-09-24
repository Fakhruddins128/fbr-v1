# FBR SaaS Backend Server

This is the backend server for the FBR SaaS application. It provides API endpoints for authentication, company management, and FBR invoice submission.

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MSSQL**: Microsoft SQL Server database
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server (2016 or higher)
- SQL Server Management Studio (SSMS) or Azure Data Studio

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=5001

# Database Configuration
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_SERVER=localhost
DB_NAME=FBR_SaaS

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# FBR API Configuration
FBR_API_BASE_URL=https://gw.fbr.gov.pk/di_data/v1/di
FBR_API_ENVIRONMENT=sandbox
```

Replace the values with your actual configuration.

### 3. Set Up the Database

1. Open SQL Server Management Studio (SSMS) or Azure Data Studio
2. Connect to your SQL Server instance
3. Run the SQL script located at `database/setup.sql`

### 4. Start the Server

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## API Endpoints

### Authentication

- **POST /api/auth/login**: Authenticate user and get JWT token

### Companies

- **GET /api/companies**: Get all companies (Super Admin only)
- **POST /api/companies**: Create a new company (Super Admin only)

### FBR Integration

- **POST /api/fbr/invoice**: Submit invoice to FBR

## Database Schema

The database includes the following tables:

- **Companies**: Store company information
- **Users**: Store user accounts with role-based access
- **Invoices**: Store invoice data
- **InvoiceItems**: Store line items for invoices
- **FBRApiTokens**: Store FBR API tokens for each company

## Integration with Frontend

The frontend React application should be configured to connect to this backend server. Update the API base URL in the frontend configuration to point to this server (default: http://localhost:5001).