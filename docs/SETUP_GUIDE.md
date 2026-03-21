# Setup Guide

Follow these steps to set up the FBR SaaS application for development.

## Prerequisites

- **Node.js**: v14 or higher
- **MSSQL**: Microsoft SQL Server (2016 or higher)
- **SSMS**: SQL Server Management Studio or Azure Data Studio
- **npm**: (Included with Node.js)

## Backend Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-repo/fbr-v1.git
    cd fbr-v1/backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` directory:
    ```
    PORT=5001
    DB_USER=sa
    DB_PASSWORD=YourStrongPassword
    DB_HOST=localhost
    DB_NAME=FBR_SaaS
    JWT_SECRET=your_jwt_secret_key
    FBR_API_BASE_URL=https://gw.fbr.gov.pk/di_data/v1/di
    FBR_API_ENVIRONMENT=sandbox
    ```

4.  **Set Up the Database**:
    - Open SSMS and connect to your SQL Server instance.
    - Execute the script at `backend/database/setup.sql` to create the database and tables.
    - Run other migration scripts in `backend/database/` if needed.

5.  **Start the Backend**:
    ```bash
    npm run dev
    ```
    The backend should be running on `http://localhost:5001`.

## Frontend Setup

1.  **Navigate to the Root Directory**:
    ```bash
    cd ..
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure API URL**:
    The frontend should point to `http://localhost:5001/api`. Check `src/services/api.ts` or similar configuration files to ensure the URL is correct.

4.  **Start the Frontend**:
    ```bash
    npm start
    ```
    The application should be accessible at `http://localhost:3000`.

## Testing the FBR Integration

1.  **Login**: Use the default superadmin or company admin credentials (if seeded).
2.  **Create an Item**: Go to the **Items** page and add a new item with a valid HS Code.
3.  **Create a Sales Invoice**: Go to the **Sales Invoice** page, select your item, and save the invoice.
4.  **Submit to FBR**: From the **Invoices** list, click **Submit to FBR**. The system will use the sandbox environment by default.
