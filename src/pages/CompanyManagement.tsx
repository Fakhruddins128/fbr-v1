import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCompanies, createCompany, updateCompany } from '../store/slices/companySlice';
import { Company } from '../types';
import { 
  BUSINESS_ACTIVITIES, 
  SECTORS, 
  getApplicableScenariosForMultiple,
  validateBusinessActivitySectorCombination
} from '../utils/scenarioValidation';

const CompanyManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies, isLoading, error } = useAppSelector(state => state.company);
  
  // Use business activities and sectors from scenario mapping
  const businessActivityOptions = BUSINESS_ACTIVITIES;
  const sectorOptions = SECTORS;
  
  // State for applicable scenarios
  const [applicableScenarios, setApplicableScenarios] = useState<string[]>([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ntnNumber: '',
    cnic: '',
    address: '',
    city: '',
    province: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    businessActivity: [] as string[],
    sector: [] as string[],
    isActive: true
  });
  
  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);
  
  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setIsEditing(true);
      setCurrentCompany(company);
      const businessActivity = company.businessActivity || [];
      const sector = company.sector || [];
      
      setFormData({
        name: company.name,
        ntnNumber: company.ntnNumber,
        cnic: company.cnic,
        address: company.address,
        city: company.city,
        province: company.province,
        contactPerson: company.contactPerson,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        businessActivity: businessActivity,
        sector: sector,
        isActive: company.isActive
      });
      
      // Calculate applicable scenarios for existing company
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
      setIsEditing(false);
      setCurrentCompany(null);
      setFormData({
        name: '',
        ntnNumber: '',
        cnic: '',
        address: '',
        city: '',
        province: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        businessActivity: [],
        sector: [],
        isActive: true
      });
      setApplicableScenarios([]);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
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
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!formData.ntnNumber.trim()) {
      errors.ntnNumber = 'NTN/CNIC number is required';
    } else if (!/^\d{7}$|^\d{13}$/.test(formData.ntnNumber.trim())) {
      errors.ntnNumber = 'NTN/CNIC must be 7 or 13 digits';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.province.trim()) {
      errors.province = 'Province is required';
    }
    
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person is required';
    }
    
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Invalid email format';
    }
    
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Phone number is required';
    }
    
    // Validate business activity and sector combinations
    const combinationValidation = validateBusinessActivitySectorCombination(
      formData.businessActivity,
      formData.sector
    );
    
    if (!combinationValidation.isValid) {
      errors.businessActivity = combinationValidation.errorMessage || 'Invalid combination';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditing && currentCompany) {
        await dispatch(updateCompany({
          ...currentCompany,
          ...formData
        }));
        setSnackbar({ open: true, message: 'Company updated successfully', severity: 'success' });
      } else {
        await dispatch(createCompany(formData));
        setSnackbar({ open: true, message: 'Company created successfully', severity: 'success' });
      }
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ open: true, message: 'An error occurred', severity: 'error' });
    }
  };
  
  const handleDeleteCompany = (company: Company) => {
    // In a real app, you would dispatch a delete action
    setSnackbar({ open: true, message: 'Company deletion is not implemented in this demo', severity: 'error' });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Company Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => dispatch(fetchCompanies())}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Company
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader aria-label="companies table">
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell>NTN Number</TableCell>
                <TableCell>CNIC</TableCell>
               
                <TableCell>Contact Phone</TableCell>
                <TableCell>Business Activity</TableCell>
                <TableCell>Sector</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    No companies found. Add your first company.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.ntnNumber}</TableCell>
                    <TableCell>{company.cnic || 'N/A'}</TableCell>
                   
                    
                    <TableCell>{company.contactPhone}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(company.businessActivity || []).map((activity, index) => (
                          <Chip key={index} label={activity} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(company.sector || []).map((sector, index) => (
                          <Chip key={index} label={sector} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(company)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteCompany(company)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add/Edit Company Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Company' : 'Add New Company'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="NTN Number"
                name="ntnNumber"
                value={formData.ntnNumber}
                onChange={handleInputChange}
                error={!!formErrors.ntnNumber}
                helperText={formErrors.ntnNumber}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="CNIC"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                error={!!formErrors.cnic}
                helperText={formErrors.cnic}
                placeholder="12345-1234567-1"
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={!!formErrors.address}
                helperText={formErrors.address}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                error={!!formErrors.city}
                helperText={formErrors.city}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                error={!!formErrors.province}
                helperText={formErrors.province}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                error={!!formErrors.contactPerson}
                helperText={formErrors.contactPerson}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                error={!!formErrors.contactEmail}
                helperText={formErrors.contactEmail}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                error={!!formErrors.contactPhone}
                helperText={formErrors.contactPhone}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
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
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
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
            </Box>
            
            {/* Applicable Scenarios Display */}
            {applicableScenarios.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
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
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyManagement;