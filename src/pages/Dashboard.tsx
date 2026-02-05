import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCompanies } from '../store/slices/companySlice';
import { UserRole } from '../types';
import dashboardApi, { DashboardData } from '../services/dashboardApi';

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { companies, isLoading } = useAppSelector(state => state.company);
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('selectedCompanyId') || '';
  });
  
  useEffect(() => {
    // Fetch companies for Super Admin
    if (user?.role === UserRole.SUPER_ADMIN) {
      dispatch(fetchCompanies());
    }
    
    // Fetch dashboard data
    fetchDashboardData(selectedCompanyId || undefined);
  }, [dispatch, user, selectedCompanyId]);
  
  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    // Save to localStorage for API calls
    if (companyId) {
      localStorage.setItem('selectedCompanyId', companyId);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
    fetchDashboardData(companyId || undefined);
  };
  
  const fetchDashboardData = async (companyId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getDashboardData(companyId);
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Chart data - populated from API
  const salesData = {
    labels: dashboardData?.salesChart.map(item => item.month) || [],
    datasets: [
      {
        label: 'Sales',
        data: dashboardData?.salesChart.map(item => item.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  const purchasesData = {
    labels: dashboardData?.salesChart.map(item => item.month) || [],
    datasets: [
      {
        label: 'Purchases',
        data: dashboardData?.salesChart.map(item => item.amount * 0.7) || [], // Mock purchases as 70% of sales
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };
  
  const inventoryData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        label: 'Inventory Status',
        data: [
          dashboardData?.inventoryStatus.inStock || 0,
          dashboardData?.inventoryStatus.lowStock || 0,
          dashboardData?.inventoryStatus.outOfStock || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Stats data - populated from API
  const stats = dashboardData?.stats || {
    totalInvoices: 0,
    totalAmount: 0,
    totalTax: 0,
    totalInventory: 0,
    totalCustomers: 0,
    profit: 0
  };
  
  // Recent activities - populated from API
  const recentActivities = dashboardData?.recentActivities || [];
  
  // Render icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ReceiptIcon color="primary" />;
      case 'purchase':
        return <ShoppingCartIcon color="secondary" />;
      case 'inventory':
        return <InventoryIcon color="success" />;
      case 'customer':
        return <PeopleIcon color="info" />;
      default:
        return <ReceiptIcon />;
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Company Selector for Super Admin */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Company</InputLabel>
            <Select
              value={selectedCompanyId}
              label="Select Company"
              onChange={(e) => handleCompanySelect(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="">
                <em>All Companies</em>
              </MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name} - {company.ntnNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* Stats Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AttachMoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Total Sales</Typography>
              <Typography variant="h4">Rs. {stats.totalAmount.toLocaleString()}</Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ReceiptIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Total Invoices</Typography>
              <Typography variant="h4">{stats.totalInvoices.toLocaleString()}</Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <InventoryIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Inventory Items</Typography>
              <Typography variant="h4">{stats.totalInventory}</Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <PeopleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Customers</Typography>
              <Typography variant="h4">{stats.totalCustomers}</Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AttachMoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Sale Excl. Tax</Typography>
              <Typography variant="h4">Rs. {stats.profit.toLocaleString()}</Typography>
            </Paper>
          </Box>
        </Box>
      )}
      
      {/* Charts */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        <Box sx={{ flex: { md: 2 } }}>
          <Card>
            <CardHeader title="Sales Overview" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={salesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: { md: 1 } }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Inventory Status" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut 
                  data={inventoryData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Recent Activities */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardHeader title="Recent Activities" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List>
                {recentActivities.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={activity.date}
                      />
                      {activity.amount > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Rs. {activity.amount.toLocaleString()}
                        </Typography>
                      )}
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
        
        {/* Purchases Chart */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardHeader title="Purchases Overview" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={purchasesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* Companies List (Super Admin Only) */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardHeader title="Companies" />
            <Divider />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {companies.map((company) => (
                    <Box key={company.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 10.667px)' } }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="h6">{company.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          NTN: {company.ntnNumber}
                        </Typography>
                        <Typography variant="body2">
                          {company.address}, {company.city}, {company.province}
                        </Typography>
                        <Typography variant="body2">
                          Contact: {company.contactPerson}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;