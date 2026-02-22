import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Fab,
  Tooltip,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CurrencyExchange as CurrencyIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import SalesInvoiceReport from '../components/SalesInvoiceReport';
import { Invoice, InvoiceItem, Company } from '../types';
import { invoiceAPI } from '../services/invoiceApi';
import { customerApi, Customer } from '../api/customerApi';
import { inventoryApi, InventoryItem } from '../services/inventoryApi';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { fetchCompanies, fetchCompanyById } from '../store/slices/companySlice';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const { companies, currentCompany, isLoading: companiesLoading } = useAppSelector(state => state.company);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Print state
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const handlePrint = (invoice: Invoice) => {
    setPrintInvoice(invoice);
    setShowPrintDialog(true);
  };

  const printInvoiceCompany = React.useMemo(() => {
    if (!printInvoice) return currentCompany;
    if (currentUser?.role === 'SUPER_ADMIN') {
      return companies.find(c => c.id === printInvoice.companyID) || currentCompany;
    }
    return currentCompany;
  }, [printInvoice, companies, currentUser, currentCompany]);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState<Omit<Invoice, 'invoiceID' | 'companyID' | 'createdAt' | 'updatedAt' | 'createdBy' | 'scenarioID' | 'totalAmount' | 'totalSalesTax' | 'totalFurtherTax' | 'totalDiscount'>>({
    invoiceType: 'Sale Invoice',
    invoiceDate: new Date().toISOString().split('T')[0],
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: 'Unregistered',
    invoiceRefNo: '',
    items: [{
      hsCode: '',
      productDescription: '',
      rate: '18%',
      uoM: '',
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
    }]
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchInventory();
    
    // Fetch companies for super admin
    if (currentUser?.role === 'SUPER_ADMIN') {
      dispatch(fetchCompanies());
    }
    
    // Fetch current user's company for all users with companyId (including ADMIN, COMPANY_ADMIN, etc.)
    if (currentUser?.companyId) {
      dispatch(fetchCompanyById(currentUser.companyId));
    }
  }, [currentUser, dispatch]);

  // Set seller information when currentCompany changes (for all non-super admin users)
  useEffect(() => {
    if (currentCompany && currentUser?.role !== 'SUPER_ADMIN') {
      setInvoiceForm(prev => ({
        ...prev,
        sellerNTNCNIC: currentCompany.ntnNumber || '',
        sellerBusinessName: currentCompany.name || '',
        sellerProvince: currentCompany.province || '',
        sellerAddress: currentCompany.address || ''
      }));
    }
  }, [currentCompany, currentUser?.role]);

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data.filter(customer => customer.isActive));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryApi.getAllInventory();
      if (response.success && response.data) {
        setInventoryItems(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchCompanyCustomers = async (companyId: string) => {
    try {
      // Create a temporary auth token with the selected company ID for super admin
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Company-ID': companyId // Pass company ID in header for super admin
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const filteredCustomers = data.data.filter((customer: Customer) => customer.isActive);
          setCustomers(filteredCustomers);
        }
      } else {
        console.error('Customer API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching company customers:', error);
    }
  };

  const fetchCompanyInventory = async (companyId: string) => {
    try {
      // Create a temporary auth token with the selected company ID for super admin
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Company-ID': companyId // Pass company ID in header for super admin
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const inventoryData = Array.isArray(data.data) ? data.data : [data.data];
          setInventoryItems(inventoryData);
        }
      } else {
        console.error('Inventory API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching company inventory:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceAPI.getAllInvoices();
      
      if (response.success && response.data) {
        const invoicesData = Array.isArray(response.data) ? response.data : [response.data];
        setInvoices(invoicesData);
      } else {
        setError(response.error || 'Failed to fetch invoices');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (invoice.fbrInvoiceNumber) {
      setSnackbar({ open: true, message: 'Cannot edit FBR submitted invoice', severity: 'error' });
      return;
    }
    navigate(`/sales-invoice/edit/${invoice.invoiceID}`);
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setInvoiceForm({
        invoiceType: invoice.invoiceType,
        invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
        sellerNTNCNIC: invoice.sellerNTNCNIC,
        sellerBusinessName: invoice.sellerBusinessName,
        sellerProvince: invoice.sellerProvince,
        sellerAddress: invoice.sellerAddress,
        buyerNTNCNIC: invoice.buyerNTNCNIC,
        buyerBusinessName: invoice.buyerBusinessName,
        buyerProvince: invoice.buyerProvince,
        buyerAddress: invoice.buyerAddress,
        buyerRegistrationType: invoice.buyerRegistrationType,
        invoiceRefNo: invoice.invoiceRefNo,
        items: invoice.items
      });
    } else {
      setEditingInvoice(null);
      
      // For non-super admin users, populate seller info with current company data
      const defaultSellerInfo = currentUser?.role !== 'SUPER_ADMIN' && currentCompany ? {
        sellerNTNCNIC: currentCompany.ntnNumber || '',
        sellerBusinessName: currentCompany.name || '',
        sellerProvince: currentCompany.province || '',
        sellerAddress: currentCompany.address || ''
      } : {
        sellerNTNCNIC: '',
        sellerBusinessName: '',
        sellerProvince: '',
        sellerAddress: ''
      };
      
      setInvoiceForm({
        invoiceType: 'Sale Invoice',
        invoiceDate: new Date().toISOString().split('T')[0],
        ...defaultSellerInfo,
        buyerNTNCNIC: '',
        buyerBusinessName: '',
        buyerProvince: '',
        buyerAddress: '',
        buyerRegistrationType: 'Unregistered',
        invoiceRefNo: '',
        items: [{
          hsCode: '',
          productDescription: '',
          rate: '18%',
          uoM: '',
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
        }]
      });
      
      // Set selected company for non-super admin users, reset for super admin
      if (currentUser?.role !== 'SUPER_ADMIN' && currentCompany) {
        setSelectedCompany(currentCompany);
      } else if (currentUser?.role === 'SUPER_ADMIN') {
        setSelectedCompany(null);
        // Clear customers and inventory for super admin until company is selected
        setCustomers([]);
        setInventoryItems([]);
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
    setSelectedCustomer(null);
    setSelectedCompany(null);
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === '') {
      setSelectedCompany(null);
      setCustomers([]);
      setInventoryItems([]);
      setSelectedCustomer(null);
      // Remove from localStorage when no company is selected
      localStorage.removeItem('selectedCompanyId');
      setInvoiceForm(prev => ({
        ...prev,
        sellerNTNCNIC: '',
        sellerBusinessName: '',
        sellerProvince: '',
        sellerAddress: '',
        buyerNTNCNIC: '',
        buyerBusinessName: '',
        buyerProvince: '',
        buyerAddress: '',
        buyerRegistrationType: 'Unregistered'
      }));
      return;
    }

    const company = companies.find(c => c.id === companyId);
    
    if (company) {
      setSelectedCompany(company);
      // Save to localStorage for API calls
      localStorage.setItem('selectedCompanyId', companyId);
      setInvoiceForm(prev => ({
        ...prev,
        sellerNTNCNIC: company.ntnNumber || '',
        sellerBusinessName: company.name || '',
        sellerProvince: company.province || '',
        sellerAddress: company.address || ''
      }));
      
      // Fetch company-specific customers and inventory for super admin
      if (currentUser?.role === 'SUPER_ADMIN') {
        fetchCompanyCustomers(companyId);
        fetchCompanyInventory(companyId);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingInvoice) {
        const invoiceData: Invoice = {
          ...invoiceForm,
          invoiceID: editingInvoice.invoiceID,
          companyID: editingInvoice.companyID,
          totalAmount: editingInvoice.totalAmount,
          totalSalesTax: editingInvoice.totalSalesTax,
          totalFurtherTax: editingInvoice.totalFurtherTax,
          totalDiscount: editingInvoice.totalDiscount,
          scenarioID: editingInvoice.scenarioID,
          createdAt: editingInvoice.createdAt,
          updatedAt: new Date().toISOString(),
          createdBy: editingInvoice.createdBy
        };
        const companyIdForHeader =
          currentUser?.role === 'SUPER_ADMIN' && selectedCompany ? selectedCompany.id : undefined;
        const response = await invoiceAPI.updateInvoice(invoiceData, companyIdForHeader);

        if (response.success && response.data) {
          setSnackbar({ open: true, message: 'Invoice updated successfully', severity: 'success' });
        } else {
          setError(response.error || 'Failed to update invoice');
          setSnackbar({ open: true, message: response.error || 'Failed to update invoice', severity: 'error' });
          return;
        }
      } else {
        // Create new invoice
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const companyID = user?.companyId || user?.id || '1';
        
        const invoiceData: Invoice = {
          ...invoiceForm,
          invoiceID: '',
          companyID: companyID,
          totalAmount: 0,
          totalSalesTax: 0,
          totalFurtherTax: 0,
          totalDiscount: 0,
          scenarioID: 'SCENARIO_001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user'
        };
        // Pass selected company ID for super admin users
        const companyIdForHeader = currentUser?.role === 'SUPER_ADMIN' && selectedCompany ? selectedCompany.id : undefined;
        const response = await invoiceAPI.createInvoice(invoiceData, companyIdForHeader);
        
        if (response.success && response.data) {
          setSnackbar({ open: true, message: 'Invoice created successfully', severity: 'success' });
        } else {
          setError(response.error || 'Failed to create invoice');
          setSnackbar({ open: true, message: response.error || 'Failed to create invoice', severity: 'error' });
          return;
        }
      }
      
      handleCloseDialog();
      fetchInvoices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setError(null);
        const response = await invoiceAPI.deleteInvoice(id);
        
        if (response.success) {
          setSnackbar({ open: true, message: 'Invoice deleted successfully', severity: 'success' });
          fetchInvoices();
        } else {
          setError(response.error || 'Failed to delete invoice');
          setSnackbar({ 
            open: true, 
            message: response.error || 'Failed to delete invoice', 
            severity: 'error' 
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Delete failed';
        setError(errorMessage);
        setSnackbar({ 
          open: true, 
          message: errorMessage, 
          severity: 'error' 
        });
      }
    }
  };

  const handleInputChange = (field: keyof typeof invoiceForm, value: any) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setInvoiceForm(prev => ({
        ...prev,
        buyerNTNCNIC: customer.buyerNTNCNIC,
        buyerBusinessName: customer.buyerBusinessName,
        buyerProvince: customer.buyerProvince,
        buyerAddress: customer.buyerAddress,
        buyerRegistrationType: customer.buyerRegistrationType
      }));
    } else {
      setSelectedCustomer(null);
      setInvoiceForm(prev => ({
        ...prev,
        buyerNTNCNIC: '',
        buyerBusinessName: '',
        buyerProvince: '',
        buyerAddress: '',
        buyerRegistrationType: 'Unregistered'
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill unit price when product is selected
    if (field === 'productDescription') {
      const selectedProduct = inventoryItems.find(item => item.productName === value);
      if (selectedProduct) {
        updatedItems[index].valueSalesExcludingST = selectedProduct.unitPrice;
        // Recalculate total values with new unit price
        updatedItems[index].totalValues = updatedItems[index].quantity * selectedProduct.unitPrice;
        
        // Calculate sales tax
        const taxRate = parseFloat(updatedItems[index].rate.replace('%', '')) / 100;
        updatedItems[index].salesTaxApplicable = selectedProduct.unitPrice * taxRate;
      }
    }
    
    // Auto-calculate totalValues when quantity or valueSalesExcludingST changes
    if (field === 'quantity' || field === 'valueSalesExcludingST') {
      const item = updatedItems[index];
      item.totalValues = item.quantity * item.valueSalesExcludingST;
      
      // Calculate sales tax
      const taxRate = parseFloat(item.rate.replace('%', '')) / 100;
      item.salesTaxApplicable = item.valueSalesExcludingST * taxRate;
    }
    
    setInvoiceForm(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, {
        hsCode: '',
        productDescription: '',
        rate: '18%',
        uoM: '',
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
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm(prev => ({
        ...prev,
        items: prev.items.filter((_: InvoiceItem, i: number) => i !== index)
      }));
    }
  };

  // Statistics calculations
  const calculateInvoiceTotal = (invoice: Invoice) => {
    const totalAmount = Number(invoice.totalAmount);
    if (!isNaN(totalAmount) && totalAmount > 0) return totalAmount;
    
    return invoice.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const totalValues = Number(item.totalValues) || 0;
      const valueSalesExcludingST = Number(item.valueSalesExcludingST) || 0;
      const fixedValue = Number(item.fixedNotifiedValueOrRetailPrice) || 0;
      
      const salesTax = Number(item.salesTaxApplicable) || 0;
      const furtherTax = Number(item.furtherTax) || 0;
      const extraTax = Number(item.extraTax) || 0;
      const discount = Number(item.discount) || 0;

      let itemValue = totalValues;
      if (itemValue <= 0) itemValue = valueSalesExcludingST;
      if (itemValue <= 0) itemValue = fixedValue;
      if (itemValue <= 0) itemValue = quantity * rate;

      const itemTotal = itemValue + salesTax + furtherTax + extraTax;
      return sum + itemTotal - discount;
    }, 0);
  };

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (calculateInvoiceTotal(invoice) || 0), 0);
  const totalSalesTax = invoices.reduce((sum, invoice) => sum + (Number(invoice.totalSalesTax) || 0), 0);
  const fbrSubmittedInvoices = invoices.filter(invoice => !!invoice.fbrInvoiceNumber).length;


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading invoices...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Invoice
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Generated Invoices No.
                  </Typography>
                  <Typography variant="h5">
                    {totalInvoices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CurrencyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sales Tax
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totalSalesTax)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total FBR Generated Invoices No.
                  </Typography>
                  <Typography variant="h5">
                    {fbrSubmittedInvoices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Actions</TableCell>
                <TableCell>SNo.</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Invoice Type</TableCell>
                <TableCell>FBR Invoice No</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Buyer Business</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Sales Tax</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice, index) => (
                <TableRow key={invoice.invoiceID} hover>
                  <TableCell>
                    <Tooltip title="Print">
                      <IconButton 
                        size="small" 
                        onClick={() => handlePrint(invoice)}
                        color="secondary"
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={invoice.fbrInvoiceNumber ? "Cannot edit FBR submitted invoice" : "Edit"}>
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditInvoice(invoice)}
                          color="primary"
                          disabled={!!invoice.fbrInvoiceNumber}
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={invoice.fbrInvoiceNumber ? "Cannot delete FBR submitted invoice" : "Delete"}>
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(invoice.invoiceID!)}
                          color="error"
                          disabled={!!invoice.fbrInvoiceNumber}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.invoiceType} 
                      color="primary" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {invoice.fbrInvoiceNumber ? (
                      <Chip 
                        label={invoice.fbrInvoiceNumber} 
                        color="success" 
                        size="small" 
                        variant="outlined"
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>{invoice.invoiceRefNo || invoice.invoiceID.substring(0, 8)}</TableCell>
                  <TableCell>{invoice.buyerBusinessName}</TableCell>
                  <TableCell>{formatCurrency(calculateInvoiceTotal(invoice))}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalSalesTax || 0)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${invoice.items.length} items`} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={invoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Invoice Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        </DialogTitle>
        <DialogContent dividers sx={{ overflow: 'auto' }}>
          <Grid container spacing={3}>
            {/* Invoice Header - Single Row */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Invoice Information
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Invoice Type</InputLabel>
                <Select
                  value={invoiceForm.invoiceType}
                label="Invoice Type"
                onChange={(e) => handleInputChange('invoiceType', e.target.value)}
              >
                <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
                <MenuItem value="Purchase Invoice">Purchase Invoice</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Date"
              type="date"
              value={invoiceForm.invoiceDate}
              onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Reference No"
              value={invoiceForm.invoiceRefNo}
              onChange={(e) => handleInputChange('invoiceRefNo', e.target.value)}
            />
          </Grid>

            {/* Seller Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Seller Information
              </Typography>
            </Grid>
            
            {/* Company Selection for Super Admin */}
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Company (Optional)</InputLabel>
                  <Select
                    value={selectedCompany?.id || ''}
                    label="Select Company (Optional)"
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    disabled={companiesLoading}
                  >
                    <MenuItem value="">
                      <em>Manual Entry</em>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name} - {company.ntnNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Seller NTN/CNIC"
                value={invoiceForm.sellerNTNCNIC}
                onChange={(e) => handleInputChange('sellerNTNCNIC', e.target.value)}
                disabled={currentUser?.role !== 'SUPER_ADMIN'}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Seller Business Name"
                value={invoiceForm.sellerBusinessName}
                onChange={(e) => handleInputChange('sellerBusinessName', e.target.value)}
                disabled={currentUser?.role !== 'SUPER_ADMIN'}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Seller Province"
                value={invoiceForm.sellerProvince}
                onChange={(e) => handleInputChange('sellerProvince', e.target.value)}
                disabled={currentUser?.role !== 'SUPER_ADMIN'}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Seller Address"
                value={invoiceForm.sellerAddress}
                onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                disabled={currentUser?.role !== 'SUPER_ADMIN'}
                required
              />
            </Grid>

            {/* Buyer Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Buyer Information
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Customer (Optional)</InputLabel>
                <Select
                  value={selectedCustomer?.id || ''}
                  label="Select Customer (Optional)"
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Manual Entry</em>
                  </MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.buyerBusinessName} - {customer.buyerNTNCNIC}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Buyer NTN/CNIC"
                value={invoiceForm.buyerNTNCNIC}
                onChange={(e) => handleInputChange('buyerNTNCNIC', e.target.value)}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Buyer Business Name"
                value={invoiceForm.buyerBusinessName}
                onChange={(e) => handleInputChange('buyerBusinessName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Buyer Province"
                value={invoiceForm.buyerProvince}
                onChange={(e) => handleInputChange('buyerProvince', e.target.value)}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Buyer Address"
                value={invoiceForm.buyerAddress}
                onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Buyer Registration Type</InputLabel>
                <Select
                  value={invoiceForm.buyerRegistrationType}
                  label="Buyer Registration Type"
                  onChange={(e) => handleInputChange('buyerRegistrationType', e.target.value)}
                >
                  <MenuItem value="Registered">Registered</MenuItem>
                  <MenuItem value="Unregistered">Unregistered</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Invoice Items */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6">
                  Invoice Items
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                >
                  Add Item
                </Button>
              </Box>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 100 }}>HS Code *</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Product Description *</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Tax Rate</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Unit of Measure</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Quantity</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Value Sales Excluding ST</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Total Values</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Sales Tax Applicable</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Further Tax</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Discount</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Sale Type</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>SRO Schedule No</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>SRO Item Serial No</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceForm.items.map((item: InvoiceItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.hsCode}
                            onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                            placeholder="HS Code"
                            required
                            sx={{ minWidth: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 140 }} required>
                            <InputLabel>Product Description</InputLabel>
                            <Select
                              value={item.productDescription}
                              onChange={(e) => handleItemChange(index, 'productDescription', e.target.value)}
                              label="Product Description"
                            >
                              <MenuItem value="">
                                <em>Select Product</em>
                              </MenuItem>
                              {inventoryItems.map((inventoryItem) => (
                                <MenuItem key={inventoryItem.id} value={inventoryItem.productName}>
                                  {inventoryItem.productName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            placeholder="18%"
                            sx={{ minWidth: 70 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.uoM}
                            onChange={(e) => handleItemChange(index, 'uoM', e.target.value)}
                            placeholder=""
                            sx={{ minWidth: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.0001 }}
                            placeholder="1"
                            sx={{ minWidth: 70 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.valueSalesExcludingST}
                            onChange={(e) => handleItemChange(index, 'valueSalesExcludingST', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01 }}
                            placeholder="0"
                            sx={{ minWidth: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.totalValues}
                            onChange={(e) => handleItemChange(index, 'totalValues', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01 }}
                            placeholder="0"
                            sx={{ minWidth: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.salesTaxApplicable}
                            onChange={(e) => handleItemChange(index, 'salesTaxApplicable', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01 }}
                            placeholder="0"
                            sx={{ minWidth: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.furtherTax}
                            onChange={(e) => handleItemChange(index, 'furtherTax', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01 }}
                            placeholder="0"
                            sx={{ minWidth: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01 }}
                            placeholder="0"
                            sx={{ minWidth: 70 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.saleType}
                            onChange={(e) => handleItemChange(index, 'saleType', e.target.value)}
                            placeholder="Goods at standard rate (default)"
                            sx={{ minWidth: 140 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.sroScheduleNo}
                            onChange={(e) => handleItemChange(index, 'sroScheduleNo', e.target.value)}
                            placeholder="SRO Schedule No"
                            sx={{ minWidth: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.sroItemSerialNo}
                            onChange={(e) => handleItemChange(index, 'sroItemSerialNo', e.target.value)}
                            placeholder="SRO Item Serial No"
                            sx={{ minWidth: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          {invoiceForm.items.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInvoice ? 'Update' : 'Create'} Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog 
        open={showPrintDialog} 
        onClose={() => setShowPrintDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              boxShadow: 'none',
              margin: 0,
              maxWidth: 'none',
              maxHeight: 'none',
              width: '100%',
              height: '100%'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          '@media print': {
            display: 'none'
          }
        }}>
          <Typography variant="h6">Invoice Preview</Typography>
          <IconButton 
            onClick={() => setShowPrintDialog(false)}
            sx={{
              '@media print': {
                display: 'none'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0,
          '@media print': {
            padding: 0
          }
        }}>
          {printInvoice && (
            <SalesInvoiceReport 
              invoiceData={{
                invoiceType: printInvoice.invoiceType,
                invoiceDate: printInvoice.invoiceDate,
                sellerNTNCNIC: printInvoice.sellerNTNCNIC || printInvoiceCompany?.ntnNumber || '',
                sellerBusinessName: printInvoiceCompany?.businessNameForSalesInvoice || printInvoice.sellerBusinessName || printInvoiceCompany?.name || '',
                sellerProvince: printInvoice.sellerProvince || printInvoiceCompany?.province || '',
                sellerAddress: printInvoice.sellerAddress || printInvoiceCompany?.address || '',
                buyerNTNCNIC: printInvoice.buyerNTNCNIC,
                buyerBusinessName: printInvoice.buyerBusinessName,
                buyerProvince: printInvoice.buyerProvince,
                buyerAddress: printInvoice.buyerAddress,
                invoiceRefNo: printInvoice.invoiceRefNo,
                poNumber: printInvoice.poNumber,
                buyerRegistrationType: printInvoice.buyerRegistrationType,
                scenarioId: printInvoice.scenarioID,
                items: printInvoice.items
              }}
              fbrResponse={printInvoice.fbrInvoiceNumber ? {
                invoiceNumber: printInvoice.fbrInvoiceNumber,
                dated: printInvoice.invoiceDate,
                validationResponse: {
                  statusCode: '100',
                  status: 'COMPLIANT',
                  error: '',
                  invoiceStatuses: []
                }
              } : undefined}
            />
          )}
        </DialogContent>
        <DialogActions sx={{
          '@media print': {
            display: 'none'
          }
        }}>
          <Button 
            onClick={() => setShowPrintDialog(false)} 
            color="secondary"
            variant="outlined"
          >
            Close
          </Button>
          <Button 
            onClick={() => window.print()} 
            color="primary"
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Invoices;
export {};
