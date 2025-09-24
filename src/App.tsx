import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import store from './store';

// Layout
import MainLayout from './components/layout/MainLayout';

// Global Error Handler
import FBRErrorHandler from './components/common/FBRErrorHandler';
import FBRErrorProvider from './components/providers/FBRErrorProvider';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FBRIntegration from './pages/FBRIntegration';
import CompanyManagement from './pages/CompanyManagement';
import SalesInvoice from './pages/SalesInvoice';
import Invoices from './pages/Invoices';

import Purchases from './pages/Purchases';
import Items from './pages/Items';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';

import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ScenarioManagement from './pages/ScenarioManagement';

// Auth guard component
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FBRErrorProvider>
          <Router>
            <FBRErrorHandler />
            <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute element={<MainLayout />} />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="fbr-integration" element={<FBRIntegration />} />
              <Route path="company-management" element={<CompanyManagement />} />
              <Route path="user-management" element={<UserManagement />} />
              
              {/* Add more routes for other modules */}
              <Route path="sales-invoice" element={<SalesInvoice />} />
              <Route path="sales-invoice/edit/:invoiceId" element={<SalesInvoice />} />
              <Route path="invoices" element={<Invoices />} />

              <Route path="purchases" element={<Purchases />} />
              <Route path="items" element={<Items />} />
              <Route path="customers" element={<Customers />} />
              <Route path="vendors" element={<Vendors />} />

              <Route path="reports" element={<Reports />} />
              <Route path="scenario-management" element={<ScenarioManagement />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </FBRErrorProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
