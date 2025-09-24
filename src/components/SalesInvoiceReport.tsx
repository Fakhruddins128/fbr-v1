import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { format } from 'date-fns';

interface InvoiceItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uoM: string;
  quantity: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  totalValues: number;
  saleType: string;
  sroItemSerialNo: string;
}

interface FbrResponse {
  invoiceNumber: string;
  dated: string;
  validationResponse: {
    statusCode: string;
    status: string;
    error: string;
    invoiceStatuses: Array<{
      itemSNo: string;
      statusCode: string;
      status: string;
      invoiceNo: string;
      errorCode: string;
      error: string;
    }>;
  };
}

interface SalesInvoiceReportProps {
  invoiceData: {
    invoiceType: string;
    invoiceDate: string;
    sellerNTNCNIC: string;
    sellerBusinessName: string;
    sellerProvince: string;
    sellerAddress: string;
    buyerNTNCNIC: string;
    buyerBusinessName: string;
    buyerProvince: string;
    buyerAddress: string;
    invoiceRefNo: string;
    buyerRegistrationType: string;
    scenarioId: string;
    items: InvoiceItem[];
  };
  fbrResponse?: FbrResponse;
}

const SalesInvoiceReport: React.FC<SalesInvoiceReportProps> = ({ invoiceData, fbrResponse }) => {
  const calculateTotals = () => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.valueSalesExcludingST, 0);
    const totalSalesTax = invoiceData.items.reduce((sum, item) => sum + item.salesTaxApplicable, 0);
    const totalFED = invoiceData.items.reduce((sum, item) => sum + item.fedPayable, 0);
    const totalDiscount = invoiceData.items.reduce((sum, item) => sum + item.discount, 0);
    
    // Calculate Grand Total properly: Subtotal + Sales Tax + FED - Discount
    const grandTotal = subtotal + totalSalesTax + totalFED - totalDiscount;
    
    return { subtotal, totalSalesTax, totalFED, totalDiscount, grandTotal };
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ 
      p: 3, 
      maxWidth: '100%', 
      width: '100%',
      margin: '0 auto', 
      backgroundColor: 'white',
      '@media print': {
        maxWidth: '210mm'
      }
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
          {invoiceData.sellerBusinessName}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Sales Invoice
        </Typography>
      </Box>

      {/* FBR Invoice Info - Only Invoice Number and Date */}
      {fbrResponse && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2">
                <strong>Invoice Number:</strong> {fbrResponse.invoiceNumber}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2">
                <strong>Date:</strong> {format(new Date(fbrResponse.dated), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Invoice Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              Seller Information
            </Typography>
            <Typography variant="body2"><strong>Business Name:</strong> {invoiceData.sellerBusinessName}</Typography>
            <Typography variant="body2"><strong>NTN/CNIC:</strong> {invoiceData.sellerNTNCNIC}</Typography>
            <Typography variant="body2"><strong>Province:</strong> {invoiceData.sellerProvince}</Typography>
            <Typography variant="body2"><strong>Address:</strong> {invoiceData.sellerAddress}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              Buyer Information
            </Typography>
            <Typography variant="body2"><strong>Business Name:</strong> {invoiceData.buyerBusinessName}</Typography>
            <Typography variant="body2"><strong>NTN/CNIC:</strong> {invoiceData.buyerNTNCNIC}</Typography>
            <Typography variant="body2"><strong>Province:</strong> {invoiceData.buyerProvince}</Typography>
            <Typography variant="body2"><strong>Address:</strong> {invoiceData.buyerAddress}</Typography>
            <Typography variant="body2"><strong>Registration Type:</strong> {invoiceData.buyerRegistrationType}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Invoice Meta Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body2"><strong>Invoice Date:</strong> {format(new Date(invoiceData.invoiceDate), 'dd/MM/yyyy')}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body2"><strong>Reference No:</strong> {invoiceData.invoiceRefNo || 'N/A'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body2"><strong>Scenario ID:</strong> {invoiceData.scenarioId}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Items Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 3,
          width: '100%',
          overflow: 'visible',
          '@media print': {
            overflow: 'visible',
            width: '100%',
            maxWidth: 'none'
          },
          '& .MuiTable-root': {
            minWidth: 'auto',
            '@media print': {
              minWidth: 'auto',
              width: '100%'
            }
          }
        }}
      >
        <Table 
          size="small" 
          sx={{ 
            width: '100%', 
            tableLayout: 'fixed',
            '@media print': {
              width: '100%',
              tableLayout: 'fixed',
              fontSize: '0.75rem'
            }
          }}
        >
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: '#f5f5f5',
              '@media print': {
                backgroundColor: '#f0f0f0'
              }
            }}>
              <TableCell sx={{ 
                width: '5%', 
                minWidth: '40px',
                '@media print': { width: '5%', minWidth: 'auto', padding: '4px' }
              }}><strong>S.No</strong></TableCell>
              <TableCell sx={{ 
                width: '12%', 
                minWidth: '80px',
                '@media print': { width: '12%', minWidth: 'auto', padding: '4px' }
              }}><strong>HS Code</strong></TableCell>
              <TableCell sx={{ 
                width: '25%', 
                minWidth: '150px',
                '@media print': { width: '25%', minWidth: 'auto', padding: '4px' }
              }}><strong>Description</strong></TableCell>
              <TableCell sx={{ 
                width: '10%', 
                minWidth: '70px',
                '@media print': { width: '10%', minWidth: 'auto', padding: '4px' }
              }}><strong>UoM</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '8%', 
                minWidth: '60px',
                '@media print': { width: '8%', minWidth: 'auto', padding: '4px' }
              }}><strong>Qty</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '8%', 
                minWidth: '60px',
                '@media print': { width: '8%', minWidth: 'auto', padding: '4px' }
              }}><strong>Rate</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '10%', 
                minWidth: '80px',
                '@media print': { width: '10%', minWidth: 'auto', padding: '4px' }
              }}><strong>Value (Ex. ST)</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '10%', 
                minWidth: '80px',
                '@media print': { width: '10%', minWidth: 'auto', padding: '4px' }
              }}><strong>Sales Tax</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '7%', 
                minWidth: '60px',
                '@media print': { width: '7%', minWidth: 'auto', padding: '4px' }
              }}><strong>FED</strong></TableCell>
              <TableCell align="right" sx={{ 
                width: '10%', 
                minWidth: '80px',
                '@media print': { width: '10%', minWidth: 'auto', padding: '4px' }
              }}><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items.map((item, index) => {
              // Calculate correct item total: Value + Sales Tax + FED - Discount
              const itemTotal = item.valueSalesExcludingST + item.salesTaxApplicable + item.fedPayable - item.discount;
              
              return (
                <TableRow key={index}>
                  <TableCell sx={{ 
                    width: '5%', 
                    minWidth: '40px', 
                    textAlign: 'center',
                    '@media print': { width: '5%', minWidth: 'auto', padding: '2px', fontSize: '0.75rem' }
                  }}>{index + 1}</TableCell>
                  <TableCell sx={{ 
                    width: '12%', 
                    minWidth: '80px',
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    '@media print': { width: '12%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.hsCode}</TableCell>
                  <TableCell sx={{ 
                    width: '25%', 
                    minWidth: '150px',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: '0.875rem',
                    '@media print': { width: '25%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.productDescription}</TableCell>
                  <TableCell sx={{ 
                    width: '10%', 
                    minWidth: '70px',
                    fontSize: '0.875rem',
                    '@media print': { width: '10%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.uoM}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '8%', 
                    minWidth: '60px',
                    fontSize: '0.875rem',
                    '@media print': { width: '8%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '8%', 
                    minWidth: '60px',
                    fontSize: '0.875rem',
                    '@media print': { width: '8%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.rate}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '10%', 
                    minWidth: '80px',
                    fontSize: '0.875rem',
                    '@media print': { width: '10%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.valueSalesExcludingST.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '10%', 
                    minWidth: '80px',
                    fontSize: '0.875rem',
                    '@media print': { width: '10%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.salesTaxApplicable.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '7%', 
                    minWidth: '60px',
                    fontSize: '0.875rem',
                    '@media print': { width: '7%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}>{item.fedPayable.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ 
                    width: '10%', 
                    minWidth: '80px',
                    fontSize: '0.875rem',
                    '@media print': { width: '10%', minWidth: 'auto', padding: '2px', fontSize: '0.7rem' }
                  }}><strong>{itemTotal.toFixed(2)}</strong></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ minWidth: 300 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Subtotal (Ex. Tax):</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{totals.subtotal.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total Sales Tax:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{totals.totalSalesTax.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total FED:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{totals.totalFED.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total Discount:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{totals.totalDiscount.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Grand Total:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }} align="right">
                {totals.grandTotal.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          This is a computer-generated invoice and does not require a signature.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </Typography>
      </Box>
    </Box>
  );
};

export default SalesInvoiceReport;