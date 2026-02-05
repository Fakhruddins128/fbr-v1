import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  OutlinedInput,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { customerApi, Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../api/customerApi';
import { 
  BUSINESS_ACTIVITIES, 
  SECTORS, 
  getApplicableScenariosForMultiple
} from '../utils/scenarioValidation';

interface CustomerFormData {
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  buyerRegistrationNo: string;
  buyerEmail: string;
  buyerCellphone: string;
  contactPersonName: string;
  businessActivity: string[];
  sector: string[];
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: '',
    buyerRegistrationNo: '',
    buyerEmail: '',
    buyerCellphone: '',
    contactPersonName: '',
    businessActivity: [],
    sector: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [uploading, setUploading] = useState(false);

  const provinces = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
  const registrationTypes = ['Registered', 'Unregistered'];
  
  // Use business activities and sectors from scenario mapping
  const businessActivityOptions = BUSINESS_ACTIVITIES;
  const sectorOptions = SECTORS;
  
  // State for applicable scenarios
  const [applicableScenarios, setApplicableScenarios] = useState<string[]>([]);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerApi.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        showSnackbar('Failed to fetch customers', 'error');
      }
    } catch (error) {
      showSnackbar('Error fetching customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  const handleMultiSelectChange = (fieldName: 'businessActivity' | 'sector') => async (event: any) => {
    const value = event.target.value;
    const newFormData = { 
      ...formData, 
      [fieldName]: typeof value === 'string' ? value.split(',') : value 
    };
    setFormData(newFormData);
    
    // Update applicable scenarios when business activity or sector changes
    if (newFormData.businessActivity.length > 0 && newFormData.sector.length > 0) {
      try {
        const scenarios = await getApplicableScenariosForMultiple(
          newFormData.businessActivity,
          newFormData.sector
        );
        setApplicableScenarios(scenarios);
      } catch (error) {
        console.error('Error fetching applicable scenarios:', error);
        setApplicableScenarios([]);
      }
    } else {
      setApplicableScenarios([]);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setFormData({
      buyerNTNCNIC: '',
      buyerBusinessName: '',
      buyerProvince: '',
      buyerAddress: '',
      buyerRegistrationType: '',
      buyerRegistrationNo: '',
      buyerEmail: '',
      buyerCellphone: '',
      contactPersonName: '',
      businessActivity: [],
      sector: [],
    });
    setApplicableScenarios([]);
    setOpenDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const businessActivity = customer.businessActivity || [];
    const sector = customer.sector || [];
    
    setFormData({
      buyerNTNCNIC: customer.buyerNTNCNIC,
      buyerBusinessName: customer.buyerBusinessName,
      buyerProvince: customer.buyerProvince,
      buyerAddress: customer.buyerAddress,
      buyerRegistrationType: customer.buyerRegistrationType,
      buyerRegistrationNo: customer.buyerRegistrationNo,
      buyerEmail: customer.buyerEmail,
      buyerCellphone: customer.buyerCellphone,
      contactPersonName: customer.contactPersonName || '',
      businessActivity: businessActivity,
      sector: sector,
    });
    
    // Calculate applicable scenarios for existing customer
    if (businessActivity.length > 0 && sector.length > 0) {
      getApplicableScenariosForMultiple(businessActivity, sector)
        .then(scenarios => setApplicableScenarios(scenarios))
        .catch(error => {
          console.error('Error fetching applicable scenarios:', error);
          setApplicableScenarios([]);
        });
    } else {
      setApplicableScenarios([]);
    }
    
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await customerApi.deleteCustomer(customerId);
      if (response.success) {
        setCustomers(customers.filter(customer => customer.id !== customerId));
        showSnackbar('Customer deleted successfully', 'success');
      } else {
        showSnackbar(response.message || 'Failed to delete customer', 'error');
      }
    } catch (error) {
      showSnackbar('Error deleting customer', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedCustomer) {
        // Update existing customer
        const updateData: UpdateCustomerRequest = {
          id: selectedCustomer.id,
          ...formData,
        };
        const response = await customerApi.updateCustomer(updateData);
        if (response.success && response.data) {
          setCustomers(customers.map(customer => 
            customer.id === selectedCustomer.id ? response.data! : customer
          ));
          showSnackbar('Customer updated successfully', 'success');
        } else {
          showSnackbar(response.message || 'Failed to update customer', 'error');
        }
      } else {
        // Add new customer
        const createData: CreateCustomerRequest = formData;
        const response = await customerApi.createCustomer(createData);
        if (response.success && response.data) {
          setCustomers([...customers, response.data]);
          showSnackbar('Customer created successfully', 'success');
        } else {
          showSnackbar(response.message || 'Failed to create customer', 'error');
        }
      }
      setOpenDialog(false);
    } catch (error) {
      showSnackbar('Error saving customer', 'error');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showSnackbar('Please select a CSV file', 'error');
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showSnackbar('CSV file must contain at least a header and one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['buyerntncnic', 'buyerbusinessname', 'buyerprovince', 'buyeraddress', 'buyerregistrationtype'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        showSnackbar(`Missing required columns: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const customer: CreateCustomerRequest = {
          buyerNTNCNIC: values[headers.indexOf('buyerntncnic')] || '',
          buyerBusinessName: values[headers.indexOf('buyerbusinessname')] || '',
          buyerProvince: values[headers.indexOf('buyerprovince')] || '',
          buyerAddress: values[headers.indexOf('buyeraddress')] || '',
          buyerRegistrationType: values[headers.indexOf('buyerregistrationtype')] || '',
          buyerRegistrationNo: values[headers.indexOf('buyerregistrationno')] || '',
          buyerEmail: values[headers.indexOf('buyeremail')] || '',
          buyerCellphone: values[headers.indexOf('buyercellphone')] || '',
          contactPersonName: values[headers.indexOf('contactpersonname')] || '',
        };

        if (customer.buyerNTNCNIC && customer.buyerBusinessName && customer.buyerProvince) {
          try {
            const response = await customerApi.createCustomer(customer);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }

      showSnackbar(
        `Import completed: ${successCount} customers added, ${errorCount} errors`,
        errorCount === 0 ? 'success' : 'error'
      );
      
      if (successCount > 0) {
        fetchCustomers();
      }
    } catch (error) {
      showSnackbar('Failed to process CSV file', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleCSVDownload = () => {
    if (customers.length === 0) {
      showSnackbar('No customer data to export', 'error');
      return;
    }

    const headers = ['BuyerNTNCNIC', 'BuyerBusinessName', 'BuyerProvince', 'BuyerAddress', 'BuyerRegistrationType', 'BuyerRegistrationNo', 'BuyerEmail', 'BuyerCellphone', 'ContactPersonName', 'BusinessActivity', 'Sector', 'IsActive', 'CreatedAt'];
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        customer.buyerNTNCNIC,
        customer.buyerBusinessName,
        customer.buyerProvince,
        customer.buyerAddress,
        customer.buyerRegistrationType,
        customer.buyerRegistrationNo || '',
        customer.buyerEmail || '',
        customer.buyerCellphone || '',
        customer.contactPersonName || '',
        customer.businessActivity?.join(';') || '',
        customer.sector?.join(';') || '',
        customer.isActive ? 'Active' : 'Inactive',
        customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar('Customer data exported successfully', 'success');
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(customer => customer.isActive).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  const uniqueRegistrationTypes = customers
    .map(customer => customer.buyerRegistrationType)
    .filter((type, index, array) => type && array.indexOf(type) === index)
    .length;



  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalCustomers}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {activeCustomers}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {inactiveCustomers}
                  </Typography>
                  <Typography color="text.secondary">
                    Inactive Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {uniqueRegistrationTypes}
                  </Typography>
                  <Typography color="text.secondary">
                    Registration Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customers Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Customer List</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCustomers}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload-customers"
              type="file"
              onChange={handleCSVUpload}
              disabled={uploading}
            />
            <label htmlFor="csv-upload-customers">
              <Button
                variant="outlined"
                component="span"
                startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                disabled={uploading}
                sx={{ borderRadius: 2 }}
              >
                {uploading ? 'Uploading...' : 'Import CSV'}
              </Button>
            </label>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleCSVDownload}
              disabled={customers.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>NTN/CNIC</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Registration No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Business Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Business Activity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.buyerNTNCNIC}</TableCell>
                  <TableCell>{customer.buyerRegistrationNo || 'N/A'}</TableCell>
                  <TableCell>{customer.buyerBusinessName}</TableCell>
                   <TableCell>{customer.contactPersonName || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {customer.businessActivity?.map((activity) => (
                        <Chip key={activity} label={activity} size="small" />
                      )) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {customer.sector?.map((sector) => (
                        <Chip key={sector} label={sector} size="small" />
                      )) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteCustomer(customer.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="NTN/CNIC"
                value={formData.buyerNTNCNIC}
                onChange={(e) => setFormData({ ...formData, buyerNTNCNIC: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Registration No"
                value={formData.buyerRegistrationNo}
                onChange={(e) => setFormData({ ...formData, buyerRegistrationNo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Name"
                value={formData.buyerBusinessName}
                onChange={(e) => setFormData({ ...formData, buyerBusinessName: e.target.value })}
              />
            </Grid>
           
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Registration Type</InputLabel>
                <Select
                  value={formData.buyerRegistrationType}
                  label="Registration Type"
                  onChange={(e) => setFormData({ ...formData, buyerRegistrationType: e.target.value })}
                >
                  {registrationTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
             <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Person Name"
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                placeholder="Enter contact person name"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cellphone"
                value={formData.buyerCellphone}
                onChange={(e) => setFormData({ ...formData, buyerCellphone: e.target.value })}
              />
            </Grid>
           <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.buyerEmail}
                onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
              />
            </Grid>
             <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Province</InputLabel>
                <Select
                  value={formData.buyerProvince}
                  label="Province"
                  onChange={(e) => setFormData({ ...formData, buyerProvince: e.target.value })}
                >
                  {provinces.map((province) => (
                    <MenuItem key={province} value={province}>
                      {province}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.buyerAddress}
                onChange={(e) => setFormData({ ...formData, buyerAddress: e.target.value })}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Business Activity</InputLabel>
                <Select
                  multiple
                  value={formData.businessActivity}
                  onChange={handleMultiSelectChange('businessActivity')}
                  input={<OutlinedInput label="Business Activity" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {businessActivityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sector</InputLabel>
                <Select
                  multiple
                  value={formData.sector}
                  onChange={handleMultiSelectChange('sector')}
                  input={<OutlinedInput label="Sector" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {sectorOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Applicable FBR Scenarios Display */}
            {applicableScenarios.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Applicable FBR Tax Scenarios ({applicableScenarios.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {applicableScenarios.map((scenario) => (
                      <Chip 
                        key={scenario} 
                        label={scenario} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    These scenarios will be automatically applied based on the selected Business Activity and Sector combinations.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedCustomer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;