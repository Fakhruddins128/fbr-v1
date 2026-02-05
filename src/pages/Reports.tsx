import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import reportsApi, { ReportsData } from '../services/reportsApi';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface ComplianceSummary {
  company: {
    name: string;
    ntnNumber: string;
    businessActivities: string[];
    sectors: string[];
  };
  applicableScenarios: string[];
  compliance: {
    totalInvoices: number;
    fbrSubmittedInvoices: number;
    complianceRate: number;
    totalSalesAmount: number;
    fbrSubmittedAmount: number;
  };
}

interface ScenarioUsage {
  applicableScenarios: string[];
  salesData: {
    invoiceDate: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    fbrInvoiceNumber: string | null;
    fbrStatus: string;
  }[];
  summary: {
    totalTransactions: number;
    fbrSubmitted: number;
    totalAmount: number;
  };
}

interface ComplianceTrends {
  trends: {
    month: string;
    totalInvoices: number;
    fbrSubmittedInvoices: number;
    complianceRate: string;
    totalAmount: number;
    fbrSubmittedAmount: number;
  }[];
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState<ReportsData>({
    salesData: [],
    topProducts: [],
    topCustomers: []
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // FBR Compliance state
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [scenarioUsage, setScenarioUsage] = useState<ScenarioUsage | null>(null);
  const [complianceTrends, setComplianceTrends] = useState<ComplianceTrends | null>(null);
  const [fbrDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const { salesData, topProducts, topCustomers } = reportsData;

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        reportType,
        dateRange,
        ...(dateRange === 'custom' && { startDate, endDate })
      };
      
      const response = await reportsApi.getReportsData(params);
      
      if (response.success && response.data) {
        setReportsData(response.data);
        showSnackbar('Reports data loaded successfully');
      } else {
        showSnackbar(response.message || 'Failed to load reports data', 'error');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showSnackbar('Failed to load reports data', 'error');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, startDate, endDate, showSnackbar]);

  const handleGenerateReport = () => {
    fetchReportsData();
  };

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleExportReport = (format: string) => {
    // Export functionality to be implemented
  };

  // FBR Compliance functions
  const fetchComplianceSummary = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/fbr-compliance-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance summary');
      }

      const data = await response.json();
      setComplianceSummary(data);
      showSnackbar('FBR compliance summary loaded successfully');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchScenarioUsage = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        startDate: fbrDateRange.startDate,
        endDate: fbrDateRange.endDate
      });
      
      const response = await fetch(`/api/reports/fbr-scenario-usage?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scenario usage');
      }

      const data = await response.json();
      setScenarioUsage(data);
      showSnackbar('FBR scenario usage loaded successfully');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceTrends = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/fbr-compliance-trends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance trends');
      }

      const data = await response.json();
      setComplianceTrends(data);
      showSnackbar('FBR compliance trends loaded successfully');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      fetchComplianceSummary();
    } else if (newValue === 2) {
      fetchScenarioUsage();
    } else if (newValue === 3) {
      fetchComplianceTrends();
    }
  };

  // FBR Compliance Report Rendering Functions
  const renderComplianceSummary = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        FBR Compliance Summary
      </Typography>
      <Grid container spacing={3}>
         <Grid size={{ xs: 12, md: 6 }}>
           <Card>
             <CardContent>
               <Typography variant="h6" color="primary">
                 Company Information
               </Typography>
               <Typography variant="body2">
                 Name: {complianceSummary?.company?.name || 'N/A'}
               </Typography>
               <Typography variant="body2">
                 NTN: {complianceSummary?.company?.ntnNumber || 'N/A'}
               </Typography>
             </CardContent>
           </Card>
         </Grid>
         <Grid size={{ xs: 12, md: 6 }}>
           <Card>
             <CardContent>
               <Typography variant="h6" color="primary">
                 Compliance Status
               </Typography>
               <Typography variant="body2">
                 Overall Rate: {complianceSummary?.compliance?.complianceRate || 0}%
               </Typography>
               <Typography variant="body2">
                 Submitted: {complianceSummary?.compliance?.fbrSubmittedInvoices || 0}
               </Typography>
               <Typography variant="body2">
                 Total: {complianceSummary?.compliance?.totalInvoices || 0}
               </Typography>
             </CardContent>
           </Card>
         </Grid>
       </Grid>
    </Paper>
  );

  const renderScenarioUsage = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        FBR Scenario Usage
      </Typography>
      <Grid container spacing={3}>
         {scenarioUsage?.applicableScenarios?.map((scenario, index) => (
           <Grid size={{ xs: 12, md: 6 }} key={index}>
             <Card>
               <CardContent>
                 <Typography variant="h6" color="primary">
                   {scenario}
                 </Typography>
                 <Typography variant="body2">
                   Total Transactions: {scenarioUsage?.summary?.totalTransactions || 0}
                 </Typography>
                 <Typography variant="body2">
                   FBR Submitted: {scenarioUsage?.summary?.fbrSubmitted || 0}
                 </Typography>
                 <Typography variant="body2">
                   Total Amount: Rs. {scenarioUsage?.summary?.totalAmount?.toLocaleString() || 0}
                 </Typography>
               </CardContent>
             </Card>
           </Grid>
         )) || []}
       </Grid>
    </Paper>
  );

  const renderComplianceTrends = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        FBR Compliance Trends
      </Typography>
      {complianceTrends && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={complianceTrends.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="complianceRate"
              stroke="#8884d8"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="fbrSubmittedInvoices"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );

  const totalSales = salesData.reduce((sum, data) => sum + data.sales, 0);
  const totalPurchases = salesData.reduce((sum, data) => sum + data.purchases, 0);
  const totalProfit = salesData.reduce((sum, data) => sum + data.profit, 0);
  const totalOrders = salesData.reduce((sum, data) => sum + data.orders, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<BarChartIcon />} 
            label="Business Reports" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="FBR Compliance Summary" 
            iconPosition="start"
          />
          <Tab 
            icon={<DescriptionIcon />} 
            label="FBR Scenario Usage" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            label="FBR Compliance Trends" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          {/* Report Controls */}
          <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Report
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="sales">Sales Report</MenuItem>
                <MenuItem value="purchases">Purchase Report</MenuItem>
                <MenuItem value="inventory">Inventory Report</MenuItem>
                <MenuItem value="customers">Customer Report</MenuItem>
                <MenuItem value="profit">Profit & Loss</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {dateRange === 'custom' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h5">
                    Rs. {totalSales.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Purchases
                  </Typography>
                  <Typography variant="h5">
                    Rs. {totalPurchases.toLocaleString()}
                  </Typography>
                </Box>
                <BarChartIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Profit
                  </Typography>
                  <Typography variant="h5">
                    Rs. {totalProfit.toLocaleString()}
                  </Typography>
                </Box>
                <PieChartIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h5">
                    {totalOrders}
                  </Typography>
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Performance Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sales Performance</Typography>
              <Box>
                <Button
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={() => handleExportReport('print')}
                  sx={{ mr: 1 }}
                >
                  Print
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('excel')}
                >
                  Export
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Purchases</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Orders</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell>{row.period}</TableCell>
                      <TableCell align="right">Rs. {row.sales.toLocaleString()}</TableCell>
                      <TableCell align="right">Rs. {row.purchases.toLocaleString()}</TableCell>
                      <TableCell align="right">Rs. {row.profit.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.orders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Products
            </Typography>
            {topProducts.map((product, index) => (
              <Box key={product.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{product.name}</Typography>
                  <Typography variant="body2" color="primary">
                    {product.percentage}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Rs. {product.sales.toLocaleString()} • {product.quantity} units
                </Typography>
                {index < topProducts.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Paper>

          {/* Top Customers */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Customers
            </Typography>
            {topCustomers.map((customer, index) => (
              <Box key={customer.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{customer.name}</Typography>
                  <Typography variant="body2" color="primary">
                    {customer.percentage}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Rs. {customer.amount.toLocaleString()} • {customer.orders} orders
                </Typography>
                {index < topCustomers.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
        </>
      )}

      {/* FBR Compliance Reports */}
      {activeTab === 1 && renderComplianceSummary()}
      {activeTab === 2 && renderScenarioUsage()}
      {activeTab === 3 && renderComplianceTrends()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;