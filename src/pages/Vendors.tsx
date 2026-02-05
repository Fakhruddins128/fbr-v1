import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { vendorApi, Vendor } from '../api/vendorApi';
import { 
  BUSINESS_ACTIVITIES, 
  SECTORS, 
  getApplicableScenariosForMultiple,
  validateBusinessActivitySectorCombination 
} from '../utils/scenarioValidation';

interface VendorFormData {
  vendorName: string;
  vendorNTN: string;
  vendorCNIC: string;
  contactPersonName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
  businessActivity: string[];
  sector: string[];
}

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    vendorName: '',
    vendorNTN: '',
    vendorCNIC: '',
    contactPersonName: '',
    vendorAddress: '',
    vendorPhone: '',
    vendorEmail: '',
    businessActivity: [],
    sector: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applicableScenarios, setApplicableScenarios] = useState<string[]>([]);

  // Use imported constants for multi-select fields
  const businessActivityOptions = BUSINESS_ACTIVITIES;
  const sectorOptions = SECTORS;

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getAllVendors();
      if (response.success && response.data) {
        setVendors(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        showSnackbar(response.error || 'Failed to fetch vendors', 'error');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showSnackbar('Failed to fetch vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      const businessActivity = vendor.businessActivity || [];
      const sector = vendor.sector || [];
      
      setFormData({
        vendorName: vendor.vendorName,
        vendorNTN: vendor.vendorNTN,
        vendorCNIC: vendor.vendorCNIC || '',
        contactPersonName: vendor.contactPersonName || '',
        vendorAddress: vendor.vendorAddress,
        vendorPhone: vendor.vendorPhone,
        vendorEmail: vendor.vendorEmail,
        businessActivity: businessActivity,
        sector: sector,
      });
      
      // Calculate applicable scenarios for existing vendor
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
    } else {
      setSelectedVendor(null);
      setFormData({
        vendorName: '',
        vendorNTN: '',
        vendorCNIC: '',
        contactPersonName: '',
        vendorAddress: '',
        vendorPhone: '',
        vendorEmail: '',
        businessActivity: [],
        sector: [],
      });
      setApplicableScenarios([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVendor(null);
    setFormData({
      vendorName: '',
      vendorNTN: '',
      vendorCNIC: '',
      contactPersonName: '',
      vendorAddress: '',
      vendorPhone: '',
      vendorEmail: '',
      businessActivity: [],
      sector: [],
    });
    setApplicableScenarios([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (fieldName: 'businessActivity' | 'sector') => async (event: any) => {
    const value = event.target.value;
    const newFormData = { 
      ...formData, 
      [fieldName]: typeof value === 'string' ? value.split(',') : value 
    };
    setFormData(newFormData);
    
    // Calculate applicable scenarios when both business activity and sector are selected
    if (newFormData.businessActivity.length > 0 && newFormData.sector.length > 0) {
      try {
        const scenarios = await getApplicableScenariosForMultiple(newFormData.businessActivity, newFormData.sector);
        setApplicableScenarios(scenarios);
      } catch (error) {
        console.error('Error fetching applicable scenarios:', error);
        setApplicableScenarios([]);
      }
    } else {
      setApplicableScenarios([]);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.vendorName.trim()) {
      showSnackbar('Vendor name is required', 'error');
      return false;
    }
    if (!formData.vendorNTN.trim()) {
      showSnackbar('Vendor NTN is required', 'error');
      return false;
    }
    if (!formData.vendorAddress.trim()) {
      showSnackbar('Vendor address is required', 'error');
      return false;
    }
    if (!formData.vendorPhone.trim()) {
      showSnackbar('Vendor phone is required', 'error');
      return false;
    }
    if (!formData.vendorEmail.trim()) {
      showSnackbar('Vendor email is required', 'error');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.vendorEmail)) {
      showSnackbar('Please enter a valid email address', 'error');
      return false;
    }
    
    // Validate business activity and sector combination
    if (formData.businessActivity.length > 0 && formData.sector.length > 0) {
      const isValidCombination = validateBusinessActivitySectorCombination(
        formData.businessActivity,
        formData.sector
      );
      if (!isValidCombination) {
        showSnackbar('Invalid Business Activity and Sector combination. Please check the valid combinations.', 'error');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let response;
      if (selectedVendor) {
        // Update existing vendor
        response = await vendorApi.updateVendor({
          vendorId: selectedVendor.vendorId,
          ...formData,
        });
      } else {
        // Create new vendor
        response = await vendorApi.createVendor(formData);
      }

      if (response.success) {
        showSnackbar(
          selectedVendor ? 'Vendor updated successfully' : 'Vendor created successfully',
          'success'
        );
        handleCloseDialog();
        fetchVendors();
      } else {
        showSnackbar(response.error || 'Failed to save vendor', 'error');
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      showSnackbar('Failed to save vendor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const response = await vendorApi.deleteVendor(vendorId);
      if (response.success) {
        showSnackbar('Vendor deleted successfully', 'success');
        fetchVendors();
      } else {
        showSnackbar(response.error || 'Failed to delete vendor', 'error');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showSnackbar('Failed to delete vendor', 'error');
    }
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
      const requiredHeaders = ['vendorname', 'vendorntn', 'vendoraddress', 'vendorphone'];
      
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

        const vendor: VendorFormData = {
          vendorName: values[headers.indexOf('vendorname')] || '',
          vendorNTN: values[headers.indexOf('vendorntn')] || '',
          vendorCNIC: values[headers.indexOf('vendorcnic')] || '',
          contactPersonName: values[headers.indexOf('contactpersonname')] || '',
          vendorAddress: values[headers.indexOf('vendoraddress')] || '',
          vendorPhone: values[headers.indexOf('vendorphone')] || '',
          vendorEmail: values[headers.indexOf('vendoremail')] || '',
          businessActivity: [],
          sector: [],
        };

        if (vendor.vendorName && vendor.vendorNTN && vendor.vendorAddress && vendor.vendorPhone) {
          try {
            const response = await vendorApi.createVendor(vendor);
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
        `Import completed: ${successCount} vendors added, ${errorCount} errors`,
        errorCount === 0 ? 'success' : 'error'
      );
      
      if (successCount > 0) {
        fetchVendors();
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
    if (vendors.length === 0) {
      showSnackbar('No vendor data to export', 'error');
      return;
    }

    const headers = ['VendorName', 'VendorNTN', 'VendorCNIC', 'ContactPersonName', 'VendorAddress', 'VendorPhone', 'VendorEmail', 'BusinessActivity', 'Sector', 'IsActive', 'CreatedAt'];
    const csvContent = [
      headers.join(','),
      ...vendors.map(vendor => [
        vendor.vendorName,
        vendor.vendorNTN,
        vendor.vendorCNIC || '',
        vendor.contactPersonName || '',
        vendor.vendorAddress,
        vendor.vendorPhone,
        vendor.vendorEmail || '',
        vendor.businessActivity?.join(';') || '',
        vendor.sector?.join(';') || '',
        vendor.isActive ? 'Active' : 'Inactive',
        vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendors_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar('Vendor data exported successfully', 'success');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Vendor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Vendor
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {vendors.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Vendors
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
                <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {vendors.filter(v => v.isActive).length}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Vendors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vendors Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Vendor List</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchVendors}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload-vendors"
              type="file"
              onChange={handleCSVUpload}
              disabled={uploading}
            />
            <label htmlFor="csv-upload-vendors">
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
              disabled={vendors.length === 0}
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
                
                <TableCell sx={{ fontWeight: 'bold' }}>CNIC/NTN</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Registration No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Business Activity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.vendorId} hover>
                  <TableCell>{vendor.vendorNTN}</TableCell>
                  <TableCell>{vendor.vendorCNIC || 'N/A'}</TableCell>
                  <TableCell>{vendor.vendorName}</TableCell>
                  <TableCell>{vendor.contactPersonName || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vendor.businessActivity?.map((activity) => (
                        <Chip key={activity} label={activity} size="small" />
                      )) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vendor.sector?.map((sector) => (
                        <Chip key={sector} label={sector} size="small" />
                      )) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Vendor">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(vendor)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Vendor">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(vendor.vendorId)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {vendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No vendors found. Click "Add Vendor" to create your first vendor.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="vendorCNIC"
                label="CNIC Number"
                value={formData.vendorCNIC}
                onChange={handleInputChange}
                fullWidth
                placeholder="e.g., 12345-1234567-1"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="vendorNTN"
                label="NTN Number"
                value={formData.vendorNTN}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="vendorName"
                label="Vendor Name"
                value={formData.vendorName}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            
          
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="contactPersonName"
                label="Contact Person Name"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                fullWidth
                placeholder="e.g., John Doe"
              />
            </Grid>
           
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="vendorPhone"
                label="Phone Number"
                value={formData.vendorPhone}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="vendorEmail"
                label="Email Address"
                type="email"
                value={formData.vendorEmail}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
             <Grid size={{ xs: 12 }}>
              <TextField
                name="vendorAddress"
                label="Address"
                value={formData.vendorAddress}
                onChange={handleInputChange}
                fullWidth
                required
                multiline
                rows={2}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />,
                }}
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
            
            {/* Applicable Scenarios Display */}
            {applicableScenarios.length > 0 && (
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Applicable FBR Scenarios:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    These scenarios are automatically determined based on your selected Business Activity and Sector.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Saving...' : selectedVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default Vendors;