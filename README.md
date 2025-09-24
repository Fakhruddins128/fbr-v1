# Multi-Tenant SaaS Application with FBR Integration

This project is a multi-tenant Software-as-a-Service (SaaS) platform that enables centralized management of multiple independent company accounts. It includes FBR (Federal Board of Revenue) integration for digital invoicing.

## Project Overview

The application follows a Shared Database, Shared Schema architecture utilizing Row-Level Data Isolation. Each record in shared tables includes a CompanyID (Tenant ID) to logically separate and secure data per company.

## Key Features

- **Multi-Tenant Architecture**: Secure data isolation between companies
- **Role-Based Access Control (RBAC)**: Different permission levels for users
- **Sales Module**: Invoice management with FBR integration
- **Purchase Module**: Manage purchase records and supplier details
- **Inventory Management**: Real-time stock tracking and alerts
- **Customer Management**: Customer profiles and purchase history
- **Reporting and Analytics**: Comprehensive reports with export options
- **FBR API Integration**: Digital invoicing with Pakistan's tax authority

## User Roles

- **Super Admin**: Full system access, manage companies, switch dashboards
- **Company Admin**: Manage their own company data
- **Custom Roles**: Admin, Accountant, Sales Person with scoped access

## Tech Stack

- **Frontend**: React.js with TypeScript
- **UI Framework**: Material-UI (MUI)
- **State Management**: Redux with Redux Toolkit
- **Routing**: React Router
- **Charts**: Chart.js with react-chartjs-2
- **API Communication**: Axios
- **Export Functionality**: jspdf, xlsx

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## FBR API Integration

The application includes integration with Pakistan's Federal Board of Revenue (FBR) for digital invoicing:

- **Production API**: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata`
- **Sandbox API**: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb`

The integration includes:
- Invoice submission to FBR
- Validation of invoice data
- Response handling for success and error cases
- Environment switching (sandbox/production)

## Project Structure

```
src/
├── api/            # API services and configurations
├── assets/         # Static assets (images, styles)
├── components/     # Reusable UI components
│   ├── auth/       # Authentication components
│   ├── common/     # Common UI elements
│   ├── dashboard/  # Dashboard components
│   ├── layout/     # Layout components
│   ├── sales/      # Sales module components
│   └── ...
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── store/          # Redux store and slices
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Future Enhancements

- RESTful API for 3rd party integrations
- Payment gateway integration
- Mobile application
- Advanced reporting and analytics
- Offline mode support

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
