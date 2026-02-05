import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Visibility, VisibilityOff, Delete, CheckCircle } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setEnvironment } from '../store/slices/fbrSlice';
import FBRInvoiceSubmission from '../components/sales/FBRInvoiceSubmission';
import { UserRole, Company } from '../types';
import { Navigate } from 'react-router-dom';
import { fetchCompanies } from '../store/slices/companySlice';
import { fbrApiService } from '../api/fbrApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fbr-tabpanel-${index}`}
      aria-labelledby={`fbr-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `fbr-tab-${index}`,
    'aria-controls': `fbr-tabpanel-${index}`,
  };
}

const FBRIntegration: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [apiToken, setApiToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [tokenCleared, setTokenCleared] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companyTokens, setCompanyTokens] = useState<Record<string, { hasToken: boolean; tokenPreview?: string }>>({});
  const [tokenError, setTokenError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useAppDispatch();
  const { environment } = useAppSelector(state => state.fbr);
  const { user } = useAppSelector(state => state.auth);
  const { companies } = useAppSelector(state => state.company);
  
  // Load companies and existing tokens on component mount
  useEffect(() => {
    const loadData = async () => {
      // Fetch companies for superadmin
      dispatch(fetchCompanies());
      
      // Load all company tokens
      try {
        const allTokens = await fbrApiService.getAllCompanyTokens();
        setCompanyTokens(allTokens);
      } catch (error) {
        console.warn('Failed to load company tokens:', error);
      }
      
      // Load global token for backward compatibility
      const globalToken = localStorage.getItem('fbr_api_token');
      if (globalToken && !selectedCompany) {
        setApiToken(globalToken);
        setHasExistingToken(true);
      }
    };
    
    loadData();
  }, [dispatch, selectedCompany]);
  
  // Update token when selected company changes
  useEffect(() => {
    const loadCompanyToken = async () => {
      if (selectedCompany) {
        try {
          const companyToken = await fbrApiService.getApiToken(selectedCompany);
          if (companyToken) {
            setApiToken(companyToken);
            setHasExistingToken(true);
          } else {
            setApiToken('');
            setHasExistingToken(false);
          }
        } catch (error) {
          console.warn('Failed to load company token:', error);
          setApiToken('');
          setHasExistingToken(false);
        }
        setTokenSaved(false);
        setTokenCleared(false);
        
        // Set selected company in localStorage for API calls
        localStorage.setItem('selectedCompanyId', selectedCompany);
      } else {
        // Clear selected company from localStorage
        localStorage.removeItem('selectedCompanyId');
      }
    };
    
    loadCompanyToken();
  }, [selectedCompany]);
  
  // Role-based access control - only SUPER_ADMIN can access FBR Integration
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleEnvironmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setEnvironment(event.target.value as 'production' | 'sandbox'));
  };
  
  const handleSaveToken = async () => {
    if (!selectedCompany) {
      setTokenError('Please select a company first');
      return;
    }
    
    // Validate token format
    const validationError = validateToken(apiToken);
    if (validationError) {
      setTokenError(validationError);
      return;
    }
    
    setIsLoading(true);
    setTokenError('');
    
    try {
      // Save company-specific token
      await fbrApiService.setApiToken(apiToken.trim(), selectedCompany);
      
      // Verify token was saved correctly
      const savedToken = await fbrApiService.getApiToken(selectedCompany);
      if (!savedToken) {
        throw new Error('Failed to save token to database');
      }
      
      // Update company tokens state
      setCompanyTokens(prev => ({
        ...prev,
        [selectedCompany]: {
          hasToken: true,
          tokenPreview: apiToken.trim().substring(0, 10) + '...'
        }
      }));
      
      setTokenSaved(true);
      setHasExistingToken(true);
      setTokenCleared(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTokenSaved(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving token:', error);
      setTokenError(error instanceof Error ? error.message : 'Failed to save token');
    } finally {
      setIsLoading(false);
    }
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setTokenSaved(false);
    }, 3000);
  };
  
  const handleClearToken = async () => {
    if (!selectedCompany) {
      setTokenError('Please select a company first');
      return;
    }
    
    setIsLoading(true);
    setTokenError('');
    
    try {
      // Clear company-specific token
      await fbrApiService.clearApiToken(selectedCompany);
      setApiToken('');
      setTokenSaved(false);
      setHasExistingToken(false);
      setTokenCleared(true);
      
      // Update company tokens state
      setCompanyTokens(prev => {
        const updated = { ...prev };
        delete updated[selectedCompany];
        return updated;
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTokenCleared(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error clearing token:', error);
      setTokenError(error instanceof Error ? error.message : 'Failed to clear token');
    } finally {
      setIsLoading(false);
    }
    
    // Hide the cleared message after 3 seconds
    setTimeout(() => {
      setTokenCleared(false);
    }, 3000);
  };
  
  const handleCompanyChange = (event: any) => {
    setSelectedCompany(event.target.value);
    setTokenError(''); // Clear any previous errors
  };
  
  // Validate FBR API token format
  const validateToken = (token: string): string | null => {
    if (!token.trim()) {
      return 'Token is required';
    }
    
    // Check if token is a valid UUID format (FBR tokens are typically UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token.trim())) {
      return 'Invalid token format. Token should be a valid UUID format.';
    }
    
    return null;
  };
  
  const toggleTokenVisibility = () => {
    setShowToken(!showToken);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        FBR Integration
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="FBR integration tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Configuration" {...a11yProps(0)} />
          <Tab label="Invoice Submission" {...a11yProps(1)} />
          <Tab label="Documentation" {...a11yProps(2)} />
        </Tabs>
        
        {/* Configuration Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Company Selection */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Company Selection" 
              subheader="Select a company to configure FBR API token"
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth>
                <InputLabel id="company-select-label">Select Company</InputLabel>
                <Select
                  labelId="company-select-label"
                  value={selectedCompany}
                  label="Select Company"
                  onChange={handleCompanyChange}
                >
                  <MenuItem value="">
                    <em>Select a company</em>
                  </MenuItem>
                  {companies.map((company: Company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Token Management Table */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Token Management" 
              subheader="Overview of FBR API tokens for all companies"
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Token Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map((company: Company) => {
                      const tokenInfo = companyTokens[company.id];
                      const hasToken = tokenInfo?.hasToken || false;
                      return (
                        <TableRow key={company.id}>
                          <TableCell>{company.name}</TableCell>
                          <TableCell>
                            {hasToken ? (
                              <Chip 
                                icon={<CheckCircle />} 
                                label="Configured" 
                                color="success" 
                                size="small" 
                              />
                            ) : (
                              <Chip 
                                label="Not Configured" 
                                color="default" 
                                size="small" 
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedCompany(company.id)}
                            >
                              Configure
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardHeader title="Environment Settings" />
                <Divider />
                <CardContent>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      aria-label="environment"
                      name="environment"
                      value={environment}
                      onChange={handleEnvironmentChange}
                    >
                      <FormControlLabel value="sandbox" control={<Radio />} label="Sandbox" />
                      <FormControlLabel value="production" control={<Radio />} label="Production" />
                    </RadioGroup>
                  </FormControl>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {environment === 'sandbox' 
                      ? 'Sandbox environment is for testing purposes only. No real data will be submitted to FBR.'
                      : 'Production environment will submit real data to FBR. Make sure you have proper authorization.'}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    API Endpoints:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Invoice Submission:</strong><br/>
                    {environment === 'sandbox' 
                      ? 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb'
                      : 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Invoice Validation:</strong><br/>
                    {environment === 'sandbox' 
                      ? 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb'
                      : 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata'}
                  </Typography>

                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardHeader 
                  title={selectedCompany ? 
                    `FBR API Token Configuration - ${companies.find(c => c.id === selectedCompany)?.name || 'Unknown Company'}` : 
                    "FBR API Token Configuration"
                  } 
                  subheader={selectedCompany ? 
                    "Configure FBR API token for the selected company" : 
                    "Please select a company to configure its FBR API token"
                  }
                  action={
                    hasExistingToken && selectedCompany && (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Token Saved" 
                        color="success" 
                        size="small" 
                      />
                    )
                  }
                />
                <Divider />
                <CardContent>
                  {!selectedCompany && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Please select a company from the table above to configure its FBR API token.
                    </Alert>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, opacity: selectedCompany ? 1 : 0.5 }}>
                    Enter your FBR API token. This token is required for authenticating with the FBR API.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="API Token"
                    variant="outlined"
                    value={apiToken}
                    onChange={(e) => {
                      setApiToken(e.target.value);
                      setTokenError(''); // Clear error on input change
                    }}
                    sx={{ mb: 2 }}
                    type={showToken ? "text" : "password"}
                    disabled={!selectedCompany || isLoading}
                    error={!!tokenError}
                    helperText={tokenError || (selectedCompany ? "Enter a valid FBR API token (UUID format)" : "Select a company first")}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={showToken ? "Hide token" : "Show token"}>
                            <IconButton
                              onClick={toggleTokenVisibility}
                              edge="end"
                              size="small"
                              disabled={!selectedCompany || isLoading}
                            >
                              {showToken ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                          {hasExistingToken && (
                            <Tooltip title="Clear token">
                              <IconButton
                                onClick={handleClearToken}
                                edge="end"
                                size="small"
                                color="error"
                                disabled={!selectedCompany || isLoading}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={handleSaveToken}
                      disabled={!apiToken.trim() || !selectedCompany || isLoading}
                    >
                      {isLoading ? 'Saving...' : (hasExistingToken ? 'Update Token' : 'Save Token')}
                    </Button>
                    
                    {hasExistingToken && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleClearToken}
                        disabled={!selectedCompany || isLoading}
                      >
                        {isLoading ? 'Clearing...' : 'Clear Token'}
                      </Button>
                    )}
                  </Box>
                  
                  {tokenError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {tokenError}
                    </Alert>
                  )}
                  
                  {tokenSaved && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Token saved successfully!
                    </Alert>
                  )}
                  
                  {tokenCleared && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Token cleared successfully!
                    </Alert>
                  )}
                  
                  {hasExistingToken && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Status:</strong> API token is configured and ready for use.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Invoice Submission Tab */}
        <TabPanel value={tabValue} index={1}>
          <FBRInvoiceSubmission />
        </TabPanel>
        
        {/* Documentation Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader title="FBR API Documentation" />
            <Divider />
            <CardContent>
              <Typography variant="h6" gutterBottom>API Endpoints</Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Invoice Submission Endpoints:
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Production:</strong> https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Sandbox:</strong> https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Invoice Validation Endpoints:
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Production:</strong> https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Sandbox:</strong> https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb
              </Typography>
              

              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Sample Payload</Typography>
              <Box component="pre" sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                border: 1, 
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'auto'
              }}>
                {JSON.stringify({
                  "invoiceType": "Sale Invoice",
                  "invoiceDate": "2025-04-21",
                  "sellerNTNCNIC": "1234567",
                  "sellerBusinessName": "Company 8",
                  "sellerProvince": "Sindh",
                  "sellerAddress": "Karachi",
                  "buyerNTNCNIC": "7654321",
                  "buyerBusinessName": "FERTILIZER MANUFAC IRS NEW",
                  "buyerProvince": "Sindh",
                  "buyerAddress": "Karachi",
                  "buyerRegistrationType": "Registered",
                  "invoiceRefNo": "",
                  "scenarioId": "SN001",
                  "items": [
                    {
                      "hsCode": "0101.2100",
                      "productDescription": "product Description",
                      "rate": "18%",
                      "uoM": "Numbers, pieces, units",
                      "quantity": 1.0000,
                      "totalValues": 0.00,
                      "valueSalesExcludingST": 1000.00,
                      "fixedNotifiedValueOrRetailPrice": 0.00,
                      "salesTaxApplicable": 180.00,
                      "salesTaxWithheldAtSource": 0.00,
                      "extraTax": 0.00,
                      "furtherTax": 120.00,
                      "sroScheduleNo": "",
                      "fedPayable": 0.00,
                      "discount": 0.00,
                      "saleType": "Goods at standard rate (default)",
                      "sroItemSerialNo": ""
                    }
                  ]
                }, null, 2)}
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Response Handling</Typography>
              <Typography variant="body1" paragraph>
                <strong>Success:</strong> 200 OK with invoice number.
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Errors:</strong> Status code 01 or HTTP 401/500, detailed messages required.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Technical Notes</Typography>
              <ul>
                <li>
                  <Typography variant="body1">
                    Authentication via secure token
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Single endpoint for sandbox & production (token-based routing)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Validation endpoint available for invoice pre-checks (validateinvoicedata_sb for sandbox)
                  </Typography>
                </li>

                <li>
                  <Typography variant="body1">
                    Internal data structure matches FBR JSON format
                  </Typography>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FBRIntegration;