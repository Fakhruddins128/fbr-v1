import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { itemsApi, Item } from '../api/itemsApi';
import { formatCurrency } from '../utils/formatUtils';
import { purchasesApi, Purchase, PurchaseItem } from '../services/purchasesApi';
import { vendorApi, Vendor } from '../api/vendorApi';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCompanies } from '../store/slices/companySlice';
import { UserRole } from '../types';

// Purchase interfaces are now imported from purchasesApi

interface FormData {
  poNumber: string;
  poDate: string;
  crNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
}

const Purchases: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.company);
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    return localStorage.getItem('selectedCompanyId') || '';
  });
  const [formData, setFormData] = useState<FormData>({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    crNumber: '',
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    vendorName: '',
    items: [{ itemId: '', itemName: '', purchasePrice: 0, purchaseQty: 0, totalAmount: 0 }]
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [submitting, setSubmitting] = useState(false);

  // Create lookup maps for better performance and filter duplicates
  const { uniqueVendors, vendorLookup } = useMemo(() => {
    const lookup = new Map<string, Vendor>();
    const unique: Vendor[] = [];
    
    vendors.forEach(vendor => {
      if (vendor.vendorId && !lookup.has(vendor.vendorId)) {
        lookup.set(vendor.vendorId, vendor);
        unique.push(vendor);
      }
    });
    
    return { uniqueVendors: unique, vendorLookup: lookup };
  }, [vendors]);

  const itemLookup = useMemo(() => {
    const lookup = new Map<string, Item>();
    items.forEach(item => lookup.set(item.itemId, item));
    return lookup;
  }, [items]);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await purchasesApi.getAllPurchases(user ? { role: user.role, companyId: user.companyId } : undefined);
      if (response.success && Array.isArray(response.data)) {
        setPurchases(response.data);
      } else {
        showSnackbar(response.message || 'Failed to fetch purchases', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch purchases', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, user]);

  const fetchItems = useCallback(async () => {
    try {
      // Check authentication before making API call
      const token = localStorage.getItem('auth_token');
      const selectedCompanyId = localStorage.getItem('selectedCompanyId');
      
      if (!token) {
        showSnackbar('Please log in to access items.', 'error');
        return;
      }
      
      // For company admins, use their companyId; for super admins, require selectedCompanyId
      if (user?.role === 'SUPER_ADMIN' && !selectedCompanyId) {
        showSnackbar('Please select a company to access items.', 'error');
        return;
      }
      
      if (user?.role !== 'SUPER_ADMIN' && !user?.companyId) {
        showSnackbar('User company information is missing. Please contact support.', 'error');
        return;
      }
      
      const response = await itemsApi.getAllItems();
      
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data);
        if (response.data.length === 0) {
          showSnackbar('No items found. Please add items first.', 'error');
        }
      } else {
        showSnackbar(`Failed to load items: ${response.message || response.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      showSnackbar('Failed to load items. Please check your authentication.', 'error');
    }
  }, [showSnackbar, user]);

  const fetchVendors = useCallback(async () => {
    try {
      // Check authentication before making API call
      const token = localStorage.getItem('auth_token');
      const selectedCompanyId = localStorage.getItem('selectedCompanyId');
      
      if (!token) {
        showSnackbar('Please log in to access vendors.', 'error');
        return;
      }
      
      // For company admins, use their companyId; for super admins, require selectedCompanyId
      if (user?.role === 'SUPER_ADMIN' && !selectedCompanyId) {
        showSnackbar('Please select a company to access vendors.', 'error');
        return;
      }
      
      if (user?.role !== 'SUPER_ADMIN' && !user?.companyId) {
        showSnackbar('User company information is missing. Please contact support.', 'error');
        return;
      }
      
      const response = await vendorApi.getAllVendors(user ? { role: user.role, companyId: user.companyId } : undefined);
      
      if (response.success && response.data) {
        const vendorArray = Array.isArray(response.data) ? response.data : [response.data];
        setVendors(vendorArray);
        if (vendorArray.length === 0) {
          showSnackbar('No vendors found. Please add vendors first.', 'error');
        }
      } else {
        showSnackbar(`Failed to fetch vendors: ${response.message || response.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch vendors. Please check your authentication.', 'error');
    }
  }, [showSnackbar, user]);

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId) {
      localStorage.setItem('selectedCompanyId', companyId);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
    // Refetch vendors and items when company changes
    fetchVendors();
    fetchItems();
  };

  useEffect(() => {
    // Fetch companies for Super Admin
    if (user?.role === UserRole.SUPER_ADMIN) {
      dispatch(fetchCompanies());
    }
    
    fetchPurchases();
    fetchItems();
    fetchVendors();
  }, [dispatch, user, fetchPurchases, fetchItems, fetchVendors]);

  // Auto-select first company for Super Admin when companies are loaded
  useEffect(() => {
    if (user?.role === UserRole.SUPER_ADMIN && companies.length > 0 && !selectedCompanyId) {
      const firstCompanyId = companies[0].id;
      setSelectedCompanyId(firstCompanyId);
      localStorage.setItem('selectedCompanyId', firstCompanyId);
      // Fetch data for the selected company
      fetchVendors();
      fetchItems();
    }
  }, [user, companies, selectedCompanyId, fetchVendors, fetchItems]);

  const resetForm = () => {
    setFormData({
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      crNumber: '',
      date: new Date().toISOString().split('T')[0],
      vendorId: '',
      vendorName: '',
      items: [{ itemId: '', itemName: '', purchasePrice: 0, purchaseQty: 0, totalAmount: 0 }]
    });
  };

  const handleAddPurchase = () => {
    setSelectedPurchase(null);
    resetForm();
    setOpenDialog(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      poNumber: purchase.poNumber || '',
      poDate: purchase.poDate || new Date().toISOString().split('T')[0],
      crNumber: purchase.crNumber || '',
      date: purchase.date || new Date().toISOString().split('T')[0],
      vendorId: purchase.vendorId || '',
      vendorName: purchase.vendorName || '',
      items: purchase.items && purchase.items.length > 0 
        ? purchase.items.map(item => ({
            itemId: item.itemId || '',
            itemName: item.itemName || '',
            purchasePrice: item.purchasePrice || 0,
            purchaseQty: item.purchaseQty || 0,
            totalAmount: item.totalAmount || 0
          }))
        : [{ itemId: '', itemName: '', purchasePrice: 0, purchaseQty: 0, totalAmount: 0 }]
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPurchase(null);
    resetForm();
  };

  const handleInputChange = useCallback((field: keyof Omit<FormData, 'items'>, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof PurchaseItem, value: string | number) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };

      // If item is selected, auto-fill item name and price using lookup map
      if (field === 'itemId' && value) {
        const selectedItem = itemLookup.get(value as string);
        if (selectedItem) {
          updatedItems[index].itemName = selectedItem.description;
          updatedItems[index].purchasePrice = selectedItem.unitPrice;
        }
      }

      // Calculate total amount for the item
      if (field === 'purchasePrice' || field === 'purchaseQty') {
        updatedItems[index].totalAmount = updatedItems[index].purchasePrice * updatedItems[index].purchaseQty;
      }

      return {
        ...prev,
        items: updatedItems
      };
    });
  }, [itemLookup]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', itemName: '', purchasePrice: 0, purchaseQty: 0, totalAmount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDeletePurchase = async (purchase: Purchase) => {
    if (!purchase.id) return;
    const confirmed = window.confirm('Are you sure you want to delete this purchase order?');
    if (!confirmed) return;

    try {
      const userParam = user ? { role: user.role, companyId: user.companyId } : undefined;
      const response = await purchasesApi.deletePurchase(purchase.id, userParam);

      if (response.success) {
        showSnackbar('Purchase deleted successfully', 'success');
        fetchPurchases();
      } else {
        showSnackbar(response.message || 'Failed to delete purchase', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to delete purchase', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.poNumber || !formData.crNumber || !formData.vendorId || !formData.vendorName || formData.items.some(item => !item.itemId || item.purchaseQty <= 0)) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate total amount
      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalAmount, 0);
      
      const purchaseData: Omit<Purchase, 'id' | 'createdAt'> = {
        ...formData,
        totalAmount,
        status: 'received' // Auto-mark as received to update inventory
      };

      let response;
      const userParam = user ? { role: user.role, companyId: user.companyId } : undefined;
      if (selectedPurchase) {
        response = await purchasesApi.updatePurchase(selectedPurchase.id!, purchaseData, userParam);
      } else {
        response = await purchasesApi.createPurchase(purchaseData, userParam);
      }

      if (response.success) {
        showSnackbar(
          selectedPurchase ? 'Purchase updated successfully' : 'Purchase added successfully',
          'success'
        );
        handleCloseDialog();
        fetchPurchases();
      } else {
        showSnackbar(response.message || 'Failed to save purchase', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to save purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const receivedPurchases = purchases.filter(purchase => purchase.status === 'received').length;
  const pendingPurchases = purchases.filter(purchase => purchase.status === 'pending').length;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Purchase Management
        </Typography>
        
        {/* Company Selection for Super Admin */}
        {user?.role === UserRole.SUPER_ADMIN && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Company</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => handleCompanySelect(e.target.value)}
              label="Select Company"
              disabled={companiesLoading}
            >
              <MenuItem value="">
                <em>All Companies</em>
              </MenuItem>
              {companies.map((company) => (
                 <MenuItem key={company.id} value={company.id}>
                   {company.name}
                 </MenuItem>
               ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Purchases
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalPurchases)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h5">
                {purchases.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Received
              </Typography>
              <Typography variant="h5">
                {receivedPurchases}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5">
                {pendingPurchases}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchases Table */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Purchase Orders</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPurchase}
          >
            Add Purchase
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CR Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{purchase.crNumber || purchase.poNumber}</TableCell>
                  <TableCell>{new Date(purchase.date || purchase.poDate || new Date()).toLocaleDateString()}</TableCell>
                  <TableCell>{purchase.vendorName}</TableCell>
                  <TableCell>{purchase.items.length}</TableCell>
                  <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      color={getStatusColor(purchase.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditPurchase(purchase)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditPurchase(purchase)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePurchase(purchase)}
                    >
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedPurchase ? 'Edit Purchase' : 'Add New Purchase'}
          {!selectedPurchase && formData.vendorName && ` - ${formData.vendorName}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="PO Number"
                value={formData.poNumber}
                onChange={(e) => handleInputChange('poNumber', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="PO Date"
                type="date"
                value={formData.poDate}
                onChange={(e) => handleInputChange('poDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="CR Number"
                value={formData.crNumber}
                onChange={(e) => handleInputChange('crNumber', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <FormControl fullWidth required>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={formData.vendorId || ''}
                    onChange={(e) => {
                      const vendorId = e.target.value as string;
                      const selectedVendor = vendorLookup.get(vendorId);
                      
                      handleInputChange('vendorId', vendorId);
                      if (selectedVendor) {
                        handleInputChange('vendorName', selectedVendor.vendorName);
                      }
                    }}
                    label="Vendor"
                  >
                    <MenuItem value="">
                      <em>Select Vendor</em>
                    </MenuItem>
                    {uniqueVendors.length === 0 ? (
                      <MenuItem disabled>
                        <em>No vendors available - Check authentication</em>
                      </MenuItem>
                    ) : (
                      uniqueVendors.map((vendor) => (
                        <MenuItem key={vendor.vendorId} value={vendor.vendorId}>
                          {vendor.vendorName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchVendors}
                  sx={{ minWidth: 'auto', px: 1 }}
                  title="Refresh vendors"
                >
                  ↻
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Items Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Purchase Items
          </Typography>
          
          {formData.items.map((item, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth required>
  <InputLabel>Item</InputLabel>
  <Select
    value={item.itemId || ''}
    onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
    label="Item"
  >
    <MenuItem value="">
      <em>Select Item</em>
    </MenuItem>
    {items.map((it) => (
      <MenuItem key={it.itemId} value={it.itemId}>
        {it.description} - {formatCurrency(it.unitPrice)}
      </MenuItem>
    ))}
  </Select>
</FormControl>

                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    value={item.purchasePrice || 0}
                    onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="Purchase Qty"
                    type="number"
                    value={item.purchaseQty || 0}
                    onChange={(e) => handleItemChange(index, 'purchaseQty', parseInt(e.target.value) || 0)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    value={(item.totalAmount || 0).toFixed(2)}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addItem}
                    >
                      Add Item
                    </Button>
                    {formData.items.length > 1 && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="h6" color="primary.contrastText">
              Total Purchase Amount: {formatCurrency(formData.items.reduce((sum, item) => sum + item.totalAmount, 0))}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (selectedPurchase ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Purchases;
