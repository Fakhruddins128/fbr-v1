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
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

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
    poNumber?: string;
    buyerRegistrationType: string;
    scenarioId: string;
    items: InvoiceItem[];
  };
  fbrResponse?: FbrResponse;
  template?: 'template1' | 'template2';
}

const formatAmount = (value: number): string => value.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const calculateTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.valueSalesExcludingST, 0);
  const totalSalesTax = items.reduce((sum, item) => sum + item.salesTaxApplicable, 0);
  const totalFED = items.reduce((sum, item) => sum + item.fedPayable, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const grandTotal = subtotal + totalSalesTax + totalFED - totalDiscount;

  return { subtotal, totalSalesTax, totalFED, totalDiscount, grandTotal };
};

const TemplateOne: React.FC<SalesInvoiceReportProps> = ({ invoiceData, fbrResponse }) => {
  const totals = calculateTotals(invoiceData.items);

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
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
          {invoiceData.sellerBusinessName}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Sales Invoice
        </Typography>
      </Box>

      {fbrResponse && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 9 }}>
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                FBR Invoice Number: {fbrResponse.invoiceNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {format(new Date(fbrResponse.dated), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ p: 1, bgcolor: 'white', border: '1px solid #ddd', borderRadius: 1 }}>
                <QRCodeCanvas
                  value={fbrResponse.invoiceNumber}
                  size={100}
                  level="H"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6 }}>
          <Typography variant="body2"><strong>Invoice Date:</strong> {format(new Date(invoiceData.invoiceDate), 'dd/MM/yyyy')}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Typography variant="body2"><strong>Reference No:</strong> {invoiceData.invoiceRefNo || 'N/A'}</Typography>
          <Typography variant="body2"><strong>PO No.:</strong> {invoiceData.poNumber || 'N/A'}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

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
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '5%' }}><strong>S.No</strong></TableCell>
              <TableCell sx={{ width: '12%' }}><strong>HS Code</strong></TableCell>
              <TableCell sx={{ width: '25%' }}><strong>Description</strong></TableCell>
              <TableCell sx={{ width: '10%' }}><strong>UoM</strong></TableCell>
              <TableCell align="right" sx={{ width: '8%' }}><strong>Qty</strong></TableCell>
              <TableCell align="right" sx={{ width: '8%' }}><strong>Rate</strong></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><strong>Value (Ex. ST)</strong></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><strong>Sales Tax</strong></TableCell>
              <TableCell align="right" sx={{ width: '7%' }}><strong>FED</strong></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items.map((item, index) => {
              const itemTotal = item.valueSalesExcludingST + item.salesTaxApplicable + item.fedPayable - item.discount;

              return (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.hsCode}</TableCell>
                  <TableCell>{item.productDescription}</TableCell>
                  <TableCell>{item.uoM}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.rate}</TableCell>
                  <TableCell align="right">{formatAmount(item.valueSalesExcludingST)}</TableCell>
                  <TableCell align="right">{formatAmount(item.salesTaxApplicable)}</TableCell>
                  <TableCell align="right">{formatAmount(item.fedPayable)}</TableCell>
                  <TableCell align="right"><strong>{formatAmount(itemTotal)}</strong></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ minWidth: 300 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Subtotal (Ex. Tax):</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{formatAmount(totals.subtotal)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total Sales Tax:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{formatAmount(totals.totalSalesTax)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total FED:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{formatAmount(totals.totalFED)}</Typography>
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="body2">Total Discount:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" align="right">{formatAmount(totals.totalDiscount)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid size={{ xs: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Grand Total:</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }} align="right">
                {formatAmount(totals.grandTotal)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

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

const TemplateTwo: React.FC<SalesInvoiceReportProps> = ({ invoiceData, fbrResponse }) => {
  const totals = calculateTotals(invoiceData.items);
  const invoiceDate = format(new Date(invoiceData.invoiceDate), 'dd/MM/yyyy');
  const inclusiveAmount = totals.subtotal + totals.totalSalesTax;
  const totalFurtherTax = invoiceData.items.reduce((sum, item) => sum + (item.furtherTax || 0), 0);
  const totalAdvanceTax = invoiceData.items.reduce((sum, item) => sum + (item.salesTaxWithheldAtSource || 0), 0);
  const totalExtraTax = invoiceData.items.reduce((sum, item) => sum + (item.extraTax || 0), 0);
  const totalQuantity = invoiceData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const netTotal = inclusiveAmount + totalFurtherTax + totalAdvanceTax + totalExtraTax;
  const qrValue = (fbrResponse?.invoiceNumber || invoiceData.invoiceRefNo || 'N/A').trim();
  const blankRows = Math.max(0, 18 - invoiceData.items.length);

  const formatPercentage = (value: number) => {
    if (!Number.isFinite(value) || value === 0) {
      return '';
    }

    const decimals = value < 1 ? 1 : value % 1 === 0 ? 0 : 2;
    return `${value.toFixed(decimals)}%`;
  };

  const furtherTaxRate = formatPercentage(totals.subtotal ? (totalFurtherTax / totals.subtotal) * 100 : 0);
  const advanceTaxRate = formatPercentage(inclusiveAmount ? (totalAdvanceTax / inclusiveAmount) * 100 : 0);
  const borderColor = '#222';
  const headerCellSx = {
    border: `1.5px solid ${borderColor}`,
    color: '#111',
    fontSize: '1rem',
    fontWeight: 700,
    lineHeight: 1.05,
    px: 0.4,
    py: 0.92,
    textAlign: 'center',
    height: '0.56in'
  };
  const bodyCellSx = {
    borderLeft: `1px solid ${borderColor}`,
    borderRight: `1px solid ${borderColor}`,
    borderBottom: '0',
    borderTop: '0',
    fontSize: '0.82rem',
    color: '#222',
    lineHeight: 1,
    px: 0.35,
    py: 0.5,
    height: '0.28in'
  };
  const totalRowCellSx = {
    borderTop: `2px solid ${borderColor}`,
    borderBottom: `2px solid ${borderColor}`,
    borderLeft: `1px solid ${borderColor}`,
    borderRight: `1px solid ${borderColor}`,
    fontSize: '0.78rem',
    fontWeight: 700,
    py: 0.55,
    px: 0.22,
    whiteSpace: 'nowrap'
  };

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        color: '#111',
        margin: '0 auto',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        px: '0.22in',
        py: '0.2in',
        fontFamily: 'Arial, Helvetica, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          px: '0.22in',
          py: '0.2in',
          boxShadow: 'none'
        }
      }}
    >
      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 500,
          lineHeight: 1.05,
          mb: '0.24in'
        }}
      >
        Sales Tax Invoice
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.98rem',
          ml: '-1.0in',
          mr: '-1.0in',
          mb: '0.14in',
          px: '0.05in'

        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography component="span" sx={{ fontSize: '0.98rem' }}>
            Invoice No. :
          </Typography>
          <Typography component="span" sx={{ fontSize: '1.04rem', fontWeight: 700, textDecoration: 'underline' }}>
            {invoiceData.invoiceRefNo || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography component="span" sx={{ fontSize: '0.98rem' }}>
            Date :
          </Typography>
          <Typography component="span" sx={{ fontSize: '1.04rem', fontWeight: 700, textDecoration: 'underline' }}>
            {invoiceDate}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.13in', ml:'-1.0in' }}>
        <Box sx={{ width: '57.8%' }}>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 1
            }}
          >
            SELLER NAME &amp; ADDRESS
          </Box>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              borderTop: '0',
              minHeight: '1.7in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              px: 0,
              pt: 0.02,
              pb: 0.45
            }}
          >
            <Box>
              <Box sx={{ backgroundColor: '#c9c9c9', py: 0.18, px: 0.8, mb: 0.3 }}>
                <Typography sx={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'underline', lineHeight: 1.1 }}>
                  {invoiceData.sellerBusinessName || 'N/A'}
                </Typography>
              </Box>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', whiteSpace: 'pre-line', px: 1.25 }}>
                {invoiceData.sellerAddress || 'N/A'}
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', mt: 0.15, px: 1.25 }}>
                {invoiceData.sellerProvince || ''}
              </Typography>
            </Box>
            <Box sx={{ pt: 0.35, px: 1.25 }}>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.3 }}>
                REG NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.3 }}>
                N T N NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '57.8%' }}>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 1
            }}
          >
            BUYER NAME &amp; ADDRESS
          </Box>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              borderTop: '0',
              minHeight: '1.7in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              px: 0,
              pt: 0.02,
              pb: 0.45
            }}
          >
            <Box>
              <Box sx={{ backgroundColor: '#c9c9c9', py: 0.18, px: 0.8, mb: 0.3 }}>
                <Typography sx={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'underline', lineHeight: 1.1 }}>
                  {invoiceData.buyerBusinessName || 'N/A'}
                </Typography>
              </Box>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', whiteSpace: 'pre-line', px: 1.25 }}>
                {invoiceData.buyerAddress || 'N/A'}
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', mt: 0.15, px: 1.25 }}>
                {invoiceData.buyerProvince || ''}
              </Typography>
            </Box>
            <Box sx={{ pt: 0.35, px: 1.25 }}>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.3 }}>
                REG NO. : <strong>{invoiceData.buyerNTNCNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.3 }}>
                N T N NO. : <strong>{invoiceData.buyerNTNCNIC || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1.5px solid ${borderColor}`,
          ml: 0,
          mr: 0,
          mb: '0.11in',
          pb: '0.02in'
        }}
      >
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '0.72in' }}>TERM :</Typography>
        <Typography sx={{ fontSize: '0.9rem' }}>CREDIT/CASH</Typography>
      </Box>

      <TableContainer
        sx={{
          mb: '0.18in',
          width: '120%',
          mr: '1.0in',
          ml:'-1.0in'
        }}
      >
        <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '5.3%' }} />
            <col style={{ width: '9.1%' }} />
            <col style={{ width: '25.8%' }} />
            <col style={{ width: '9.9%' }} />
            <col style={{ width: '13.4%' }} />
            <col style={{ width: '7.4%' }} />
            <col style={{ width: '9.6%' }} />
            <col style={{ width: '13.2%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2} sx={headerCellSx}>Quantity</TableCell>
              <TableCell sx={headerCellSx}>
                H. S.
                <br />
                CODE
              </TableCell>
              <TableCell sx={headerCellSx}>Description Of Goods</TableCell>
              <TableCell sx={headerCellSx}>Unit Price</TableCell>
              <TableCell sx={headerCellSx}>
                Val. Excl.
                <br />
                S.Tax
              </TableCell>
              <TableCell sx={headerCellSx}>
                Rate Of
                <br />
                S. Tax
              </TableCell>
              <TableCell sx={headerCellSx}>Sales Tax</TableCell>
              <TableCell sx={headerCellSx}>
                Val. Incl.
                <br />
                S.Tax
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items.map((item, index) => {
              const unitPrice = item.quantity ? item.valueSalesExcludingST / item.quantity : item.valueSalesExcludingST;
              const lineInclusive = item.valueSalesExcludingST + item.salesTaxApplicable;
              const displayUom = item.uoM === 'Numbers, pieces, units' ? 'NOS' : item.uoM;

              return (
                <TableRow key={index}>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', verticalAlign: 'top' }}>{item.quantity}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{displayUom}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', px: 0.6, verticalAlign: 'top' }}>{item.hsCode}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, verticalAlign: 'top' }}>{item.productDescription}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top' }}>{formatAmount(unitPrice)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top' }}>{formatAmount(item.valueSalesExcludingST)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', verticalAlign: 'top' }}>{item.rate}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top' }}>{formatAmount(item.salesTaxApplicable)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top' }}>{formatAmount(lineInclusive)}</TableCell>
                </TableRow>
              );
            })}

            {Array.from({ length: blankRows }).map((_, index) => (
              <TableRow key={`blank-${index}`}>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
                <TableCell sx={bodyCellSx}>&nbsp;</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'center',
                  fontSize: '0.85rem'
                }}
              >
                {totalQuantity || ''}
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx
                }}
              />
              <TableCell
                colSpan={3}
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'center',
                  fontSize: '0.85rem'
                }}
              >
                Total Amount :
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'right'
                }}
              >
                {formatAmount(totals.subtotal)}
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx
                }}
              />
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'right',
                  fontSize: '0.74rem'
                }}
              >
                {formatAmount(totals.totalSalesTax)}
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'right',
                  fontSize: '0.74rem'
                }}
              >
                {formatAmount(inclusiveAmount)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ width: '48%', pl: '0.02in' }}>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, mb: '0.08in' }}>
            Comments:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.4, mb: '0.1in' }}>
            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700 }}>
              FBR INVOICE :
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
              {qrValue}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.16in' }}>
            <Box
              component="img"
              src="/fbr-digital-logo.png"
              alt="FBR Digital"
              sx={{ width: '0.7in', height: '0.7in', objectFit: 'contain', display: 'block' }}
            />
            <Box
              sx={{
                width: '0.7in',
                height: '0.7in',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                '& canvas': {
                  width: '0.7in !important',
                  height: '0.7in !important',
                  display: 'block'
                }
              }}
            >
              <QRCodeCanvas
                value={qrValue}
                size={68}
                level="H"
                includeMargin={false}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '36%', mr: '0.04in' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>INCL AMOUNT :</Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatAmount(inclusiveAmount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>FURTHER TAX :</Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
              {furtherTaxRate ? `@ ${furtherTaxRate}` : ''}
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatAmount(totalFurtherTax)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>ADVANCE TAX :</Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
              {advanceTaxRate ? `@ ${advanceTaxRate}` : ''}
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatAmount(totalAdvanceTax)}</Typography>
          </Box>
          {totalExtraTax > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>EXTRA TAX :</Typography>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
                &nbsp;
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatAmount(totalExtraTax)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>NET TOTAL :</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{formatAmount(netTotal)}</Typography>
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '0.72rem',
          mt: 'auto',
          pt: '0.42in',
          fontFamily: '"Times New Roman", serif'
        }}
      >
        NOTE : THIS IS A SYSTEM GENERATED DOCUMENT DOES NOT REQUIRED ANY SIGNATURE AND STAMP
      </Typography>
    </Box>
  );
};

const SalesInvoiceReport: React.FC<SalesInvoiceReportProps> = (props) => {
  if (props.template === 'template2') {
    return <TemplateTwo {...props} />;
  }

  return <TemplateOne {...props} />;
};

export default SalesInvoiceReport;
