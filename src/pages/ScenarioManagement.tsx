import React, { useState, useEffect } from 'react';
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
  Grid,
  Divider,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  BUSINESS_ACTIVITIES,
  SECTORS,
  getApplicableScenariosForMultiple,
  validateBusinessActivitySectorCombination,
  type BusinessActivity,
  type Sector,
} from '../utils/scenarioValidation';

interface ScenarioMapping {
  id: string;
  businessActivity: BusinessActivity;
  sector: Sector;
  applicableScenarios: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScenarioFormData {
  businessActivity: BusinessActivity | '';
  sector: Sector | '';
  applicableScenarios: string[];
}

const ScenarioManagement: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMapping | null>(null);
  const [formData, setFormData] = useState<ScenarioFormData>({
    businessActivity: '',
    sector: '',
    applicableScenarios: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBusinessActivity, setFilterBusinessActivity] = useState<BusinessActivity | ''>('');
  const [filterSector, setFilterSector] = useState<Sector | ''>('');
  const [activeTab, setActiveTab] = useState(0);
  const [errorCodeSearch, setErrorCodeSearch] = useState('');

  // Available FBR scenarios based on official documentation
  const availableScenarios = [
    'SN001', 'SN002', 'SN003', 'SN004', 'SN005', 'SN006', 'SN007', 'SN008',
    'SN009', 'SN010', 'SN011', 'SN012', 'SN013', 'SN014', 'SN015', 'SN016',
    'SN017', 'SN018', 'SN019', 'SN020', 'SN021', 'SN022', 'SN023', 'SN024',
    'SN025', 'SN026', 'SN027', 'SN028'
  ];

  // FBR Error Codes for validation and troubleshooting
  const fbrErrorCodes = [
    { code: '0001', message: 'Seller not registered for sales tax', description: 'Seller not registered for sales tax, please provide valid registration/NTN' },
    { code: '0002', message: 'Invalid Buyer Registration No or NTN', description: 'Buyer Registration Number or NTN is not in proper format' },
    { code: '0003', message: 'Provide proper invoice type', description: 'Invoice type cannot be empty, please provide proper invoice type' },
    { code: '0005', message: 'Provide date in valid format', description: 'Invoice date is not in proper format, please provide invoice date in "YYYY-MM-DD" format' },
    { code: '0006', message: 'Sale invoice not exist', description: 'Sales invoice does not exist against STWH' },
    { code: '0007', message: 'Wrong Sale type is selected', description: 'Selected invoice type is not associated with proper registration number' },
    { code: '0008', message: 'ST withheld at source should either be zero or Invoice no', description: 'ST withheld at source is not equal to zero or sales tax, please enter ST withheld equal to sales tax' },
    { code: '0009', message: 'Provide Buyer registration No', description: 'Buyer Registration Number cannot be empty, please provide proper Buyer registration type' },
    { code: '0010', message: 'Provide Buyer Name', description: 'Buyer Name cannot be empty, please provide valid buyer name' },
    { code: '0011', message: 'Provide invoice type', description: 'Invoice type cannot be empty, please provide valid invoice type' },
    { code: '0012', message: 'Provide Buyer Registration Type', description: 'Buyer Registration type cannot be empty, please provide proper buyer registration type' },
    { code: '0013', message: 'Provide valid Sale type', description: 'Sale type cannot be empty/null, please provide valid sale type' },
    { code: '0018', message: 'Please provide Sales Tax/FED in ST Mode', description: 'Sales Tax/FED cannot be empty, please provide Sales Tax/FED' },
    { code: '0019', message: 'Please provide HSCode', description: 'HS Code cannot be empty, please provide valid HS Code' },
    { code: '0020', message: 'Please provide Rate', description: 'Rate field cannot be empty, please provide Rate' },
    { code: '0021', message: 'Please provide value of Sales Excl. ST /Quantity', description: 'Value of Sales Excl. ST /Quantity cannot be empty, Please provide valid Value Excl. ST or ST Quantity' },
    { code: '0022', message: 'Please provide ST withheld at Source or STS Withheld', description: 'ST withheld at Source or STS Withheld cannot be empty, Please provide valid value for ST withheld at Source or STS Withheld' },
    { code: '0023', message: 'Please provide Sales Tax', description: 'Sales Tax withheld cannot be empty, Please provide valid Sales Tax withheld' },
    { code: '0024', message: 'Please provide ST withheld', description: 'Sales Tax withheld cannot be empty, Please provide valid Sales Tax withheld' }
  ];

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      // Mock data based on official FBR documentation - in real app, this would be an API call
      const mockScenarios: ScenarioMapping[] = [
        {
          id: '1',
          businessActivity: 'Manufacturing',
          sector: 'Steel',
          applicableScenarios: ['SN003', 'SN004', 'SN011'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          businessActivity: 'Manufacturing',
          sector: 'FMCG',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          businessActivity: 'Manufacturing',
          sector: 'Textile',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          businessActivity: 'Retailer',
          sector: 'FMCG',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN008'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '5',
          businessActivity: 'Retailer',
          sector: 'Textile',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN009'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '6',
          businessActivity: 'Retailer',
          sector: 'Pharmaceuticals',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '7',
          businessActivity: 'Wholesaler',
          sector: 'FMCG',
          applicableScenarios: ['SN026', 'SN027', 'SN028', 'SN008'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '8',
          businessActivity: 'Service Provider',
          sector: 'Services',
          applicableScenarios: ['SN018', 'SN019'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '9',
          businessActivity: 'Other',
          sector: 'Pharmaceuticals',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '10',
          businessActivity: 'Other',
          sector: 'Wholesale/Retails',
          applicableScenarios: ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setScenarios(mockScenarios);
    } catch (error) {
      showSnackbar('Error fetching scenarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (scenario?: ScenarioMapping) => {
    if (scenario) {
      setSelectedScenario(scenario);
      setFormData({
        businessActivity: scenario.businessActivity,
        sector: scenario.sector,
        applicableScenarios: scenario.applicableScenarios,
      });
    } else {
      setSelectedScenario(null);
      setFormData({
        businessActivity: '',
        sector: '',
        applicableScenarios: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedScenario(null);
  };

  const handleInputChange = (field: keyof ScenarioFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScenarioChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      applicableScenarios: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.businessActivity) {
      showSnackbar('Business Activity is required', 'error');
      return false;
    }
    if (!formData.sector) {
      showSnackbar('Sector is required', 'error');
      return false;
    }
    if (formData.applicableScenarios.length === 0) {
      showSnackbar('At least one applicable scenario is required', 'error');
      return false;
    }

    // Validate business activity and sector combination
    const isValidCombination = validateBusinessActivitySectorCombination(
      [formData.businessActivity],
      [formData.sector]
    );
    if (!isValidCombination) {
      showSnackbar('Invalid Business Activity and Sector combination', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (selectedScenario) {
        // Update existing scenario
        const updatedScenario: ScenarioMapping = {
          ...selectedScenario,
          businessActivity: formData.businessActivity as BusinessActivity,
          sector: formData.sector as Sector,
          applicableScenarios: formData.applicableScenarios,
          updatedAt: new Date().toISOString(),
        };
        setScenarios(scenarios.map(s => s.id === selectedScenario.id ? updatedScenario : s));
        showSnackbar('Scenario updated successfully', 'success');
      } else {
        // Add new scenario
        const newScenario: ScenarioMapping = {
          id: Date.now().toString(),
          businessActivity: formData.businessActivity as BusinessActivity,
          sector: formData.sector as Sector,
          applicableScenarios: formData.applicableScenarios,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setScenarios([...scenarios, newScenario]);
        showSnackbar('Scenario created successfully', 'success');
      }
      setOpenDialog(false);
    } catch (error) {
      showSnackbar('Error saving scenario', 'error');
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
      showSnackbar('Scenario deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Error deleting scenario', 'error');
    }
  };

  // Filter scenarios based on search and filters
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = !searchTerm || 
      scenario.businessActivity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.applicableScenarios.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBusinessActivity = !filterBusinessActivity || scenario.businessActivity === filterBusinessActivity;
    const matchesSector = !filterSector || scenario.sector === filterSector;
    
    return matchesSearch && matchesBusinessActivity && matchesSector;
  });

  const totalScenarios = scenarios.length;
  const uniqueBusinessActivities = new Set(scenarios.map(s => s.businessActivity)).size;
  const uniqueSectors = new Set(scenarios.map(s => s.sector)).size;

  // Filter error codes based on search
  const filteredErrorCodes = fbrErrorCodes.filter(errorCode => 
    !errorCodeSearch || 
    errorCode.code.toLowerCase().includes(errorCodeSearch.toLowerCase()) ||
    errorCode.message.toLowerCase().includes(errorCodeSearch.toLowerCase()) ||
    errorCode.description.toLowerCase().includes(errorCodeSearch.toLowerCase())
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          FBR Scenario & Error Management
        </Typography>
        {activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Scenario
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label="Scenario Mappings" 
            icon={<AssignmentIcon />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            label="Error Codes" 
            icon={<ErrorIcon />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalScenarios}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Scenarios
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {uniqueBusinessActivities}
                  </Typography>
                  <Typography color="text.secondary">
                    Business Activities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CategoryIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {uniqueSectors}
                  </Typography>
                  <Typography color="text.secondary">
                    Sectors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {filteredScenarios.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Filtered Results
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Business Activity</InputLabel>
              <Select
                value={filterBusinessActivity}
                onChange={(e) => setFilterBusinessActivity(e.target.value as BusinessActivity | '')}
                label="Business Activity"
              >
                <MenuItem value="">All Activities</MenuItem>
                {BUSINESS_ACTIVITIES.map((activity) => (
                  <MenuItem key={activity} value={activity}>
                    {activity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sector</InputLabel>
              <Select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value as Sector | '')}
                label="Sector"
              >
                <MenuItem value="">All Sectors</MenuItem>
                {SECTORS.map((sector) => (
                  <MenuItem key={sector} value={sector}>
                    {sector}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchScenarios}
            >
              Refresh
            </Button>
        </Box>
      </Paper>

      {/* Scenarios Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Scenario Mappings</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredScenarios.length} of {totalScenarios} scenarios
          </Typography>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Business Activity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Applicable Scenarios</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredScenarios.map((scenario) => (
                  <TableRow key={scenario.id} hover>
                    <TableCell>{scenario.businessActivity}</TableCell>
                    <TableCell>{scenario.sector}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {scenario.applicableScenarios.map((s) => (
                          <Chip key={s} label={s} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(scenario.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(scenario)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredScenarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No scenarios found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
        </>
      )}

      {/* Error Codes Tab */}
      {activeTab === 1 && (
        <>
          {/* Error Codes Search */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <TextField
              fullWidth
              placeholder="Search error codes by code, message, or description..."
              value={errorCodeSearch}
              onChange={(e) => setErrorCodeSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Paper>

          {/* Error Codes List */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">FBR Error Codes</Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredErrorCodes.length} of {fbrErrorCodes.length} error codes
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              {filteredErrorCodes.map((errorCode, index) => (
                <Accordion key={errorCode.code} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`error-${errorCode.code}-content`}
                    id={`error-${errorCode.code}-header`}
                    sx={{
                      backgroundColor: 'rgba(255, 0, 0, 0.04)',
                      '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.08)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <ErrorIcon sx={{ color: 'error.main', mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          Error Code: {errorCode.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {errorCode.message}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <InfoIcon sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Description:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {errorCode.description}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
              {filteredErrorCodes.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No error codes found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedScenario ? 'Edit Scenario' : 'Add New Scenario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <FormControl fullWidth>
                <InputLabel>Business Activity</InputLabel>
                <Select
                  value={formData.businessActivity}
                  onChange={(e) => handleInputChange('businessActivity', e.target.value)}
                  label="Business Activity"
                >
                  {BUSINESS_ACTIVITIES.map((activity) => (
                    <MenuItem key={activity} value={activity}>
                      {activity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Sector</InputLabel>
                <Select
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  label="Sector"
                >
                  {SECTORS.map((sector) => (
                    <MenuItem key={sector} value={sector}>
                      {sector}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
              <FormControl fullWidth>
                <InputLabel>Applicable Scenarios</InputLabel>
                <Select
                  multiple
                  value={formData.applicableScenarios}
                  onChange={handleScenarioChange}
                  input={<OutlinedInput label="Applicable Scenarios" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableScenarios.map((scenario) => (
                    <MenuItem key={scenario} value={scenario}>
                      {scenario}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedScenario ? 'Update' : 'Add'}
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

export default ScenarioManagement;