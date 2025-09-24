import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Divider, 
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField, 
  Typography,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import { FBRInvoicePayload, FBRInvoiceItem } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { submitInvoiceToFBR, clearValidationErrors, clearLastResponse } from '../../store/slices/fbrSlice';
import { formatFBRDate, validateFBRInvoice } from '../../utils/fbrUtils';

// Default empty invoice item
const emptyInvoiceItem: FBRInvoiceItem = {
  hsCode: '',
  productDescription: '',
  rate: '18%',
  uoM: 'Numbers, pieces, units',
  quantity: 1,
  totalValues: 0,
  valueSalesExcludingST: 0,
  fixedNotifiedValueOrRetailPrice: 0,
  salesTaxApplicable: 0,
  salesTaxWithheldAtSource: 0,
  extraTax: 0,
  furtherTax: 0,
  sroScheduleNo: '',
  fedPayable: 0,
  discount: 0,
  saleType: 'Goods at standard rate (default)',
  sroItemSerialNo: ''
};

// Default invoice data
const defaultInvoiceData: FBRInvoicePayload = {
  invoiceType: 'Sale Invoice',
  invoiceDate: formatFBRDate(new Date()),
  sellerNTNCNIC: '',
  sellerBusinessName: '',
  sellerProvince: 'Sindh',
  sellerAddress: '',
  buyerNTNCNIC: '',
  buyerBusinessName: '',
  buyerProvince: 'Sindh',
  buyerAddress: '',
  buyerRegistrationType: 'Registered',
  invoiceRefNo: '',
  scenarioId: 'SN001',
  items: [{ ...emptyInvoiceItem }]
};

// Province options
const provinces = [
  'Sindh',
  'Punjab',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir'
];

// Registration type options
const registrationTypes = [
  'Registered',
  'Unregistered',
  'Foreign'
];

const FBRInvoiceSubmission: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSubmitting, lastResponse, validationErrors, environment } = useAppSelector(state => state.fbr);
  const { currentCompany } = useAppSelector(state => state.company);
  
  // State for invoice form
  const [invoiceData, setInvoiceData] = useState<FBRInvoicePayload>(defaultInvoiceData);
  const [localValidationErrors, setLocalValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  // Prefill seller information if company data is available
  useEffect(() => {
    if (currentCompany) {
      setInvoiceData(prev => ({
        ...prev,
        sellerNTNCNIC: currentCompany.ntnNumber,
        sellerBusinessName: currentCompany.name,
        sellerProvince: currentCompany.province,
        sellerAddress: `${currentCompany.address}, ${currentCompany.city}`
      }));
    }
  }, [currentCompany]);
  
  // Handle success response
  useEffect(() => {
    if (lastResponse && lastResponse.status === '00' && lastResponse.invoiceNumber) {
      setSuccessMessage(`Invoice successfully submitted to FBR. Invoice Number: ${lastResponse.invoiceNumber}`);
      setShowSuccessAlert(true);
      // Reset form after successful submission
      setInvoiceData({
        ...defaultInvoiceData,
        sellerNTNCNIC: currentCompany?.ntnNumber || '',
        sellerBusinessName: currentCompany?.name || '',
        sellerProvince: currentCompany?.province || 'Sindh',
        sellerAddress: currentCompany ? `${currentCompany.address}, ${currentCompany.city}` : ''
      });
    }
  }, [lastResponse, currentCompany]);
  
  // Handle input change for main invoice fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle input change for invoice items
  const handleItemChange = (index: number, field: keyof FBRInvoiceItem, value: any) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Auto-calculate sales tax if value excluding sales tax changes
    if (field === 'valueSalesExcludingST') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Calculate 18% sales tax
        updatedItems[index].salesTaxApplicable = Math.round(numValue * 0.18 * 100) / 100;
        // Calculate 12% further tax
        updatedItems[index].furtherTax = Math.round(numValue * 0.12 * 100) / 100;
      }
    }
    
    setInvoiceData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Add new item
  const handleAddItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyInvoiceItem }]
    }));
  };
  
  // Remove item
  const handleRemoveItem = (index: number) => {
    if (invoiceData.items.length > 1) {
      const updatedItems = [...invoiceData.items];
      updatedItems.splice(index, 1);
      setInvoiceData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };
  
  // Validate and submit invoice
  const handleSubmit = () => {
    // Clear previous errors
    setLocalValidationErrors([]);
    dispatch(clearValidationErrors());
    
    // Validate invoice data
    const validation = validateFBRInvoice(invoiceData);
    if (!validation.isValid) {
      setLocalValidationErrors(validation.errors);
      return;
    }
    
    // Submit to FBR
    dispatch(submitInvoiceToFBR(invoiceData));
  };
  
  // Handle close of success alert
  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    dispatch(clearLastResponse());
  };
  
  // Calculate totals
  const calculateTotals = () => {
    return invoiceData.items.reduce(
      (totals, item) => {
        return {
          valueSalesExcludingST: totals.valueSalesExcludingST + (parseFloat(item.valueSalesExcludingST.toString()) || 0),
          salesTaxApplicable: totals.salesTaxApplicable + (parseFloat(item.salesTaxApplicable.toString()) || 0),
          furtherTax: totals.furtherTax + (parseFloat(item.furtherTax.toString()) || 0),
          total: totals.total + (
            (parseFloat(item.valueSalesExcludingST.toString()) || 0) +
            (parseFloat(item.salesTaxApplicable.toString()) || 0) +
            (parseFloat(item.furtherTax.toString()) || 0) -
            (parseFloat(item.discount.toString()) || 0)
          )
        };
      },
      { valueSalesExcludingST: 0, salesTaxApplicable: 0, furtherTax: 0, total: 0 }
    );
  };
  
  const totals = calculateTotals();
  
  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader 
          title="FBR Invoice Submission" 
          subheader={`Environment: ${environment.toUpperCase()}`}
        />
        <Divider />
        <CardContent>
          {/* Error messages */}
          {(localValidationErrors.length > 0 || validationErrors.length > 0) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold">Validation Errors:</Typography>
              <ul>
                {localValidationErrors.map((error, index) => (
                  <li key={`local-${index}`}>{error}</li>
                ))}
                {validationErrors.map((error, index) => (
                  <li key={`api-${index}`}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          {/* Invoice Form */}
          <div>
            {/* Invoice Details */}
            <Box>
              <Typography variant="h6" gutterBottom>Invoice Details</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Invoice Type"
                  name="invoiceType"
                  value={invoiceData.invoiceType}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  name="invoiceDate"
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Invoice Reference Number"
                  name="invoiceRefNo"
                  value={invoiceData.invoiceRefNo}
                  onChange={handleInputChange}
                />
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Scenario ID"
                  name="scenarioId"
                  value={invoiceData.scenarioId}
                  onChange={handleInputChange}
                  required
                />
              </Box>
            </Box>
            
            {/* Seller Information */}
            <Box>
              <Typography variant="h6" gutterBottom>Seller Information</Typography>
            </Box>
            
            <div className="seller-info-container">
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Seller NTN/CNIC"
                  name="sellerNTNCNIC"
                  value={invoiceData.sellerNTNCNIC}
                  onChange={handleInputChange}
                  required
                  helperText="7 digits for NTN or 13 digits for CNIC"
                />
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Seller Business Name"
                  name="sellerBusinessName"
                  value={invoiceData.sellerBusinessName}
                  onChange={handleInputChange}
                  required
                />
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  select
                  label="Seller Province"
                  name="sellerProvince"
                  value={invoiceData.sellerProvince}
                  onChange={handleInputChange}
                  required
                >
                  {provinces.map((province) => (
                    <MenuItem key={province} value={province}>
                      {province}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Seller Address"
                  name="sellerAddress"
                  value={invoiceData.sellerAddress}
                  onChange={handleInputChange}
                  required
                />
              </Box>
            </div>
            
            {/* Buyer Information */}
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>Buyer Information</Typography>
            </Box>
            
            <div className="buyer-info-container">
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Buyer NTN/CNIC"
                  name="buyerNTNCNIC"
                  value={invoiceData.buyerNTNCNIC}
                  onChange={handleInputChange}
                  required
                  helperText="7 digits for NTN or 13 digits for CNIC"
                />
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Buyer Business Name"
                  name="buyerBusinessName"
                  value={invoiceData.buyerBusinessName}
                  onChange={handleInputChange}
                  required
                />
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  select
                  label="Buyer Province"
                  name="buyerProvince"
                  value={invoiceData.buyerProvince}
                  onChange={handleInputChange}
                  required
                >
                  {provinces.map((province) => (
                    <MenuItem key={province} value={province}>
                      {province}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <TextField
                  fullWidth
                  label="Buyer Address"
                  name="buyerAddress"
                  value={invoiceData.buyerAddress}
                  onChange={handleInputChange}
                  required
                />
              </Box>
            </div>
            
            <Box>
              <FormControl component="fieldset">
                <FormLabel component="legend">Buyer Registration Type</FormLabel>
                <RadioGroup
                  row
                  name="buyerRegistrationType"
                  value={invoiceData.buyerRegistrationType}
                  onChange={handleInputChange}
                >
                  {registrationTypes.map((type) => (
                    <FormControlLabel 
                      key={type} 
                      value={type} 
                      control={<Radio />} 
                      label={type} 
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
            
            {/* Invoice Items */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Invoice Items</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>HS Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Value Excl. ST</TableCell>
                      <TableCell>Sales Tax (18%)</TableCell>
                      <TableCell>Further Tax (12%)</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.hsCode}
                            onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.productDescription}
                            onChange={(e) => handleItemChange(index, 'productDescription', e.target.value)}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            required
                            inputProps={{ min: 1, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.valueSalesExcludingST}
                            onChange={(e) => handleItemChange(index, 'valueSalesExcludingST', parseFloat(e.target.value))}
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.salesTaxApplicable}
                            onChange={(e) => handleItemChange(index, 'salesTaxApplicable', parseFloat(e.target.value))}
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.furtherTax}
                            onChange={(e) => handleItemChange(index, 'furtherTax', parseFloat(e.target.value))}
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveItem(index)}
                            disabled={invoiceData.items.length <= 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle1" fontWeight="bold">Totals:</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{totals.valueSalesExcludingST.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{totals.salesTaxApplicable.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{totals.furtherTax.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total: {totals.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Submit Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="large"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to FBR'}
              </Button>
            </Box>
          </div>
        </CardContent>
      </Card>
      
      {/* Success message */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={handleCloseSuccessAlert}
      >
        <Alert onClose={handleCloseSuccessAlert} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FBRInvoiceSubmission;