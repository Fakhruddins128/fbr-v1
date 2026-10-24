import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MenuItem,
  InputLabel,
  Select,
  CircularProgress,
  Tooltip,
  Stack,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { downloadCSVFile, formatCurrency, formatDate, parseCSV } from '../utils/formatUtils';
import useTableControls from '../hooks/useTableControls';
import SortableTableCell from '../components/common/SortableTableCell';
import TablePaginationControls from '../components/common/TablePaginationControls';
import { itemsApi, Item, CreateItemRequest } from '../api/itemsApi';

interface ItemFormData {
  hsCode: string;
  description: string;
  unitPrice: number;
  purchaseTaxValue: number;
  salesTaxValue: number;
  uom: string;
  initialStock: number;
}

/** Fields the search box matches against. */
const SEARCH_FIELDS = (item: Item) => [item.hsCode, item.description, item.uom];

const SORT_ACCESSORS: Record<string, (item: Item) => string | number | null | undefined> = {
  hsCode: (item) => item.hsCode,
  description: (item) => item.description,
  unitPrice: (item) => item.unitPrice,
  currentStock: (item) => item.currentStock ?? 0,
  purchaseTaxValue: (item) => item.purchaseTaxValue,
  salesTaxValue: (item) => item.salesTaxValue,
  uom: (item) => item.uom,
  isActive: (item) => (item.isActive ? 1 : 0),
  itemCreateDate: (item) => item.itemCreateDate
};

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    hsCode: '',
    description: '',
    unitPrice: 0,
    purchaseTaxValue: 0,
    salesTaxValue: 0,
    uom: '',
    initialStock: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const uoms = ['1000 kWh', '40KG', 'Bag', 'Barrels', 'Bill of lading', 'Carat', 'Cubic Metre', 'Dozen', 'Foot', 'Gallon', 'Gram', 'KG', 'Kilogram', 'KWH', 'Liter', 'Mega Watt', 'Meter', 'MMBTU', 'MT', 'NO', 'Numbers, pieces, units', 'Others', 'Packs', 'Pair', 'Pcs', 'Pound', 'SET', 'Square Foot', 'Square Metre', 'SqY', 'Thousand Unit', 'Timber Logs'];

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await itemsApi.getAllItems();
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        showSnackbar(response.message || 'Failed to fetch items', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch items', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        hsCode: item.hsCode,
        description: item.description,
        unitPrice: item.unitPrice,
        purchaseTaxValue: item.purchaseTaxValue,
        salesTaxValue: item.salesTaxValue,
        uom: item.uom ,
        initialStock: item.initialStock || 0,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        hsCode: '',
        description: '',
        unitPrice: 0,
        purchaseTaxValue: 0,
        salesTaxValue: 0,
        uom: '',
        initialStock: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
      hsCode: '',
      description: '',
      unitPrice: 0,
      purchaseTaxValue: 0,
      salesTaxValue: 0,
      uom: '',
      initialStock: 0,
    });
  };

  const handleSubmit = async () => {
    if (!formData.hsCode || !formData.description || formData.unitPrice <= 0) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const itemData: CreateItemRequest = {
        hsCode: formData.hsCode,
        description: formData.description,
        unitPrice: formData.unitPrice,
        purchaseTaxValue: formData.purchaseTaxValue,
        salesTaxValue: formData.salesTaxValue,
        uom: formData.uom || 'Numbers, pieces, units',
        initialStock: formData.initialStock,
      };

      let response;
      if (selectedItem) {
        response = await itemsApi.updateItem(selectedItem.itemId, itemData);
      } else {
        response = await itemsApi.createItem(itemData);
      }

      if (response.success) {
        showSnackbar(
          selectedItem ? 'Item updated successfully' : 'Item created successfully',
          'success'
        );
        handleCloseDialog();
        fetchItems();
      } else {
        showSnackbar(response.message || 'Failed to save item', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to save item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await itemsApi.deleteItem(itemId);
      if (response.success) {
        showSnackbar('Item deleted successfully', 'success');
        fetchItems();
      } else {
        showSnackbar(response.message || 'Failed to delete item', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
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
      // Quoted fields matter here: the default UoM contains commas
      const rows = parseCSV(text);

      if (rows.length < 2) {
        showSnackbar('CSV file must contain headers and at least one data row', 'error');
        return;
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const requiredHeaders = ['hscode', 'description', 'unitprice', 'purchasetaxvalue', 'salestaxvalue'];

      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        showSnackbar(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].map(v => v.trim());
        const valueOf = (header: string) => {
          const index = headers.indexOf(header);
          return index === -1 ? '' : values[index] ?? '';
        };

        const item: CreateItemRequest = {
          hsCode: valueOf('hscode'),
          description: valueOf('description'),
          unitPrice: parseFloat(valueOf('unitprice')) || 0,
          purchaseTaxValue: parseFloat(valueOf('purchasetaxvalue')) || 0,
          salesTaxValue: parseFloat(valueOf('salestaxvalue')) || 0,
          // The API rejects a blank UoM, so fall back to the form's default
          uom: valueOf('uom') || 'Numbers, pieces, units',
          initialStock: parseFloat(valueOf('initialstock')) || 0,
        };

        if (item.hsCode && item.description && item.unitPrice > 0) {
          try {
            const response = await itemsApi.createItem(item);
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
        `Import completed: ${successCount} items added, ${errorCount} errors`,
        errorCount === 0 ? 'success' : 'error'
      );
      
      if (successCount > 0) {
        fetchItems();
      }
    } catch (error) {
      showSnackbar('Failed to process CSV file', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCSVDownload = () => {
    if (items.length === 0) {
      showSnackbar('No items to export', 'error');
      return;
    }

    downloadCSVFile(
      `items_${new Date().toISOString().split('T')[0]}.csv`,
      [
        // Mirrors the import template so an exported file can be edited and
        // imported straight back. InitialStock is the opening figure, not
        // current stock, which is derived from purchases and invoices.
        ['HSCode', 'Description', 'UnitPrice', 'PurchaseTaxValue', 'SalesTaxValue', 'UoM', 'InitialStock', 'ItemCreateDate'],
        ...items.map(item => [
          item.hsCode,
          item.description,
          item.unitPrice,
          item.purchaseTaxValue,
          item.salesTaxValue,
          item.uom,
          item.initialStock,
          item.itemCreateDate
        ])
      ]
    );
  };

  const handleTemplateDownload = () => {
    downloadCSVFile(
      'items_import_template.csv',
      [
        ['HSCode', 'Description', 'UnitPrice', 'PurchaseTaxValue', 'SalesTaxValue', 'UoM', 'InitialStock'],
        [
          '0101.2100',
          'Sample Item',
          1000,
          0,
          18,
          'Numbers, pieces, units',
          50,
        ],
      ]
    );

    showSnackbar('Item CSV template downloaded successfully', 'success');
  };

  // Select filters run first, then the hook's search and sort
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter === 'active' && !item.isActive) return false;
        if (statusFilter === 'inactive' && item.isActive) return false;
        if (stockFilter === 'in' && (item.currentStock ?? 0) <= 0) return false;
        if (stockFilter === 'out' && (item.currentStock ?? 0) > 0) return false;
        return true;
      }),
    [items, statusFilter, stockFilter]
  );

  const controls = useTableControls<Item>({
    rows: filteredItems,
    searchFields: SEARCH_FIELDS,
    sortAccessors: SORT_ACCESSORS,
    initialSortKey: 'hsCode'
  });

  // Calculate summary statistics
  const totalItems = items.length;
  const activeItems = items.filter(item => item.isActive).length;
  const totalValue = items.reduce((sum, item) => sum + item.unitPrice, 0);
  const avgTaxRate = items.length > 0 ? items.reduce((sum, item) => sum + item.salesTaxValue, 0) / items.length : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Items Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalItems}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Items
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
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {activeItems}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Items
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
                <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(totalValue)}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Value
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
                <ReceiptIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {avgTaxRate.toFixed(1)}%
                  </Typography>
                  <Typography color="text.secondary">
                    Avg Tax Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Items List</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchItems}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload-items"
              type="file"
              onChange={handleCSVUpload}
              disabled={uploading}
            />
            <label htmlFor="csv-upload-items">
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
              onClick={handleTemplateDownload}
              sx={{ borderRadius: 2 }}
            >
              Download Template (CSV)
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleCSVDownload}
              disabled={items.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            size="small"
            label="Search items"
            placeholder="HS code, description or unit"
            value={controls.search}
            onChange={(e) => controls.setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Stock"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="in">In stock</MenuItem>
            <MenuItem value="out">Out of stock</MenuItem>
          </TextField>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="body2" color="text.secondary">
            {controls.rows.length} of {items.length} items
          </Typography>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <SortableTableCell columnKey="hsCode" label="HS Code" sort={controls} />
                <SortableTableCell columnKey="description" label="Description" sort={controls} />
                <SortableTableCell columnKey="unitPrice" label="Unit Price" sort={controls} />
                <SortableTableCell columnKey="currentStock" label="Current Stock" sort={controls} align="center" />
                <SortableTableCell columnKey="purchaseTaxValue" label="Purchase Tax" sort={controls} />
                <SortableTableCell columnKey="salesTaxValue" label="Sales Tax" sort={controls} />
                <SortableTableCell columnKey="uom" label="UoM" sort={controls} />
                <SortableTableCell columnKey="isActive" label="Status" sort={controls} />
                <SortableTableCell columnKey="itemCreateDate" label="Created Date" sort={controls} />
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {controls.pageRows.map((item) => (
                <TableRow key={item.itemId} hover>
                  <TableCell>{item.hsCode}</TableCell>
                  <TableCell>
                    <Tooltip title={item.description}>
                      <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.description}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  {/* <TableCell align="center">{item.initialStock || 0}</TableCell> */}
                  <TableCell align="center">
                    <Chip 
                      label={item.currentStock || 0} 
                      color={(item.currentStock || 0) <= 0 ? "error" : "primary"}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.purchaseTaxValue.toFixed(2)}%</TableCell>
                  <TableCell>{item.salesTaxValue.toFixed(2)}%</TableCell>
                  <TableCell>{item.uom || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Active' : 'Inactive'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.itemCreateDate ? formatDate(item.itemCreateDate) : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Item">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Item">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.itemId)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No items found. Click "Add Item" to create your first item.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePaginationControls pagination={controls} />
      </Paper>

      {/* Add/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="HS Code"
                value={formData.hsCode}
                onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Initial Stock"
                type="number"
                value={formData.initialStock}
                onChange={(e) => setFormData({ ...formData, initialStock: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
                helperText="Opening inventory balance"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Purchase Tax Value (%)"
                type="number"
                value={formData.purchaseTaxValue}
                onChange={(e) => setFormData({ ...formData, purchaseTaxValue: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Sales Tax Value (%)"
                type="number"
                value={formData.salesTaxValue}
                onChange={(e) => setFormData({ ...formData, salesTaxValue: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {/* <TextField
                fullWidth
                label="Unit of Measurement"
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                required
                placeholder="e.g., PCS, KG, LTR, MTR"
              /> */}
              <FormControl fullWidth>
                <InputLabel>Unit of Measurement</InputLabel>
                <Select
                  value={formData.uom}
                  label="Unit of Measurement"
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                >
                  {uoms.map((uoms1) => (
                    <MenuItem key={uoms1} value={uoms1}>
                      {uoms1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Saving...' : selectedItem ? 'Update' : 'Create'}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Items;
