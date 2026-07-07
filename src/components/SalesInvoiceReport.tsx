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
    buyerNIC?: string;
    buyerNTN?: string;
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
  template?: 'template1' | 'template2' | 'template3' | 'template4';
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

const SMALL_NUMBER_WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS_WORDS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const numberToWords = (value: number): string => {
  const whole = Math.floor(Math.abs(value));

  if (whole < 20) {
    return SMALL_NUMBER_WORDS[whole];
  }

  if (whole < 100) {
    const tens = Math.floor(whole / 10);
    const remainder = whole % 10;
    return remainder ? `${TENS_WORDS[tens]}-${SMALL_NUMBER_WORDS[remainder]}` : TENS_WORDS[tens];
  }

  if (whole < 1000) {
    const hundreds = Math.floor(whole / 100);
    const remainder = whole % 100;
    return remainder
      ? `${SMALL_NUMBER_WORDS[hundreds]} Hundred ${numberToWords(remainder)}`
      : `${SMALL_NUMBER_WORDS[hundreds]} Hundred`;
  }

  if (whole < 1000000) {
    const thousands = Math.floor(whole / 1000);
    const remainder = whole % 1000;
    return remainder
      ? `${numberToWords(thousands)} Thousand ${numberToWords(remainder)}`
      : `${numberToWords(thousands)} Thousand`;
  }

  if (whole < 1000000000) {
    const millions = Math.floor(whole / 1000000);
    const remainder = whole % 1000000;
    return remainder
      ? `${numberToWords(millions)} Million ${numberToWords(remainder)}`
      : `${numberToWords(millions)} Million`;
  }

  const billions = Math.floor(whole / 1000000000);
  const remainder = whole % 1000000000;
  return remainder
    ? `${numberToWords(billions)} Billion ${numberToWords(remainder)}`
    : `${numberToWords(billions)} Billion`;
};

const amountToWords = (amount: number): string => {
  const whole = Math.floor(amount);
  const paisa = Math.round((amount - whole) * 100);
  const wholeText = numberToWords(whole);
  const paisaText = paisa > 0 ? ` And ${numberToWords(paisa)} Paisa` : '';
  return `${wholeText}${paisaText} Only`;
};

const parsePercentNumber = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const cleaned = value.replace('%', '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
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
            <Typography variant="body2"><strong>NIC:</strong> {invoiceData.buyerNIC || 'N/A'}</Typography>
            <Typography variant="body2"><strong>NTN:</strong> {invoiceData.buyerNTN || 'N/A'}</Typography>
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
  const blankRows = Math.max(0, 12 - invoiceData.items.length);   // to ensure 12 rows are used

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
    backgroundColor: '#88b4e0ff',
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
    borderLeft: `1.5px solid ${borderColor}`,
    borderRight: `1.5px solid ${borderColor}`,
    borderBottom: '0',
    borderTop: '0',
    fontSize: '0.82rem',
    color: '#222',
    lineHeight: 1,
    px: 0.35,
    py: 0.5,
    height: '0.28in',
    paddingTop: '20px',
    paddingBottom: '20px'
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
    whiteSpace: 'nowrap',
    backgroundColor: '#88b4e0ff',
    color: '#111',
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
          fontSize: '1.25rem',
          ml: '-1.0in',
          mr: '-0.6in',
          mb: '0.14in',
          px: '0.05in'

        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography component="span" sx={{ fontSize: '1.25rem' }}>
            Invoice No. :
          </Typography>
          <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: 'underline' }}>
            {invoiceData.invoiceRefNo || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography component="span" sx={{ fontSize: '1.25rem' }}>
            Date :
          </Typography>
          <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: 'underline' }}>
            {invoiceDate}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.13in', ml:'-1.0in',  mr: '-0.6in' }}>
        <Box sx={{ width: '47.8%' }}>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 2,
              backgroundColor: '#1976d2',
              color:'#ffffff'
            }}
          >
            SELLER NAME &amp; ADDRESS
          </Box>
          <Box
            sx={{
              border: `0`,
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 2
            }}
          >
             
          </Box>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              
              minHeight: '1.7in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              px: 0,
              pt: 0.45,
              pb: 0.45,
              mt: 0.5
            }}
          >
            <Box>
              <Box sx={{ backgroundColor: '#c06048ff', py: 0.18, px: 0.8, mb: 0.5 }}>
                <Typography sx={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase',  lineHeight: 1.1 }}>
                  {invoiceData.sellerBusinessName || 'N/A'}
                </Typography>
              </Box>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', whiteSpace: 'pre-line', px: 1.25 }}>
                {invoiceData.sellerAddress || 'N/A'}
              </Typography>
              {/* <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', mt: 0.15, px: 1.25 }}>
                {invoiceData.sellerProvince || ''}
              </Typography> */}
            </Box>
            <Box sx={{ pt: 0.35, px: 1.25 }}>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', lineHeight: 1.3 }}>
                REG NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', lineHeight: 1.3 }}>
                NTN NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '47.8%' }}>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 2,
              backgroundColor: '#1976d2',
               color:'#ffffff'
            }}
          >
            BUYER NAME &amp; ADDRESS
          </Box>
              <Box
            sx={{
              border: `0`,
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              py: 0.2,
              lineHeight: 2
            }}
          >
             
          </Box>
          <Box
            sx={{
              border: `1.5px solid ${borderColor}`,
             
              minHeight: '1.7in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              px: 0,
              pt: 0.45,
              pb: 0.45,
              mt: 0.5
            }}
          >
            <Box>
              <Box sx={{ backgroundColor: '#c06048ff', py: 0.18, px: 0.8, mb: 0.5 }}>
                <Typography sx={{ textAlign: 'center', color: '#fff',fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase',  lineHeight: 1.1 }}>
                  {invoiceData.buyerBusinessName || 'N/A'}
                </Typography>
              </Box>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', whiteSpace: 'pre-line', px: 1.25 }}>
                {invoiceData.buyerAddress || 'N/A'}
              </Typography>
              {/* <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', fontWeight: 700, lineHeight: 1.45, textTransform: 'uppercase', mt: 0.15, px: 1.25 }}>
                {invoiceData.buyerProvince || ''}
              </Typography> */}
            </Box>
            <Box sx={{ pt: 0.35, px: 1.25 }}>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', lineHeight: 1.3 }}>
                NIC NO. : <strong>{invoiceData.buyerNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: '1.00rem', lineHeight: 1.3 }}>
                NTN NO. : <strong>{invoiceData.buyerNTN || 'N/A'}</strong>
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
          ml: '-1.0in',
          mr: '-0.5in',
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
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '26.4%' }} />
            <col style={{ width: '9.9%' }} />
            <col style={{ width: '12.8%' }} />
            <col style={{ width: '7.4%' }} />
            <col style={{ width: '9.6%' }} />
            <col style={{ width: '12.8%' }} />
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
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{item.quantity}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{displayUom}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', px: 0.6, verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{item.hsCode}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{item.productDescription}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{formatAmount(unitPrice)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{formatAmount(item.valueSalesExcludingST)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'center', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{item.rate}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{formatAmount(item.salesTaxApplicable)}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, textAlign: 'right', verticalAlign: 'top', fontSize: '1.00rem', borderBottom: `1.5px solid ${borderColor}` }}>{formatAmount(lineInclusive)}</TableCell>
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
                  fontSize: '1.00rem'
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
                  fontSize: '1.00rem'   
                }}
              >
                Total Amount :
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'right',
                  fontSize: '1.00rem'
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
                  fontSize: '1.00rem'
                }}
              >
                {formatAmount(totals.totalSalesTax)}
              </TableCell>
              <TableCell
                sx={{
                  ...totalRowCellSx,
                  textAlign: 'right',
                  fontSize: '1.00rem'
                }}
              >
                {formatAmount(inclusiveAmount)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', ml:'-1.0in' }}>
        <Box sx={{ width: '48%', pl: '0.02in' }}>
          <Typography sx={{ fontSize: '1.00rem', fontWeight: 700, mb: '0.08in' }}>
            Comments:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.4, mb: '0.1in' }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
              FBR INVOICE :
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {qrValue}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.16in' }}>
            <Box
              component="img"
              src="/fbr-digital-logo.png"
              alt="FBR Digital"
              sx={{ width: '1.25in', height: '1.25in', objectFit: 'contain', display: 'block' }}
            />
            <Box
              sx={{
                width: '1.25in',
                height: '1.25in',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                '& canvas': {
                  width: '1.25in !important',
                  height: '1.25in !important',
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

        <Box sx={{ width: '36%', mr: '-0.5in' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>INCL AMOUNT :</Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>{formatAmount(inclusiveAmount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>FURTHER TAX :</Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
              {furtherTaxRate ? `@ ${furtherTaxRate}` : ''}
            </Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>{formatAmount(totalFurtherTax)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>ADVANCE TAX :</Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
              {advanceTaxRate ? `@ ${advanceTaxRate}` : ''}
            </Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>{formatAmount(totalAdvanceTax)}</Typography>
          </Box>
          {totalExtraTax > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.55 }}>
              <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>EXTRA TAX :</Typography>
              <Typography sx={{ fontSize: '1.00rem', fontWeight: 700, minWidth: '0.62in', textAlign: 'center' }}>
                &nbsp;
              </Typography>
              <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>{formatAmount(totalExtraTax)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>NET TOTAL :</Typography>
            <Typography sx={{ fontSize: '1.00rem', fontWeight: 700 }}>{formatAmount(netTotal)}</Typography>
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '0.85rem',
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

const TemplateThree: React.FC<SalesInvoiceReportProps> = ({ invoiceData, fbrResponse }) => {
  const totals = calculateTotals(invoiceData.items);
  const invoiceDate = format(new Date(invoiceData.invoiceDate), 'dd-MMM-yyyy');
  const printDateTime = format(new Date(), 'EEEE, d MMMM, yyyy  h:mm:ss a');
  const fbrInvoiceNo = fbrResponse?.invoiceNumber || 'N/A';
  const companyTopLine = [
    invoiceData.sellerAddress,
    invoiceData.sellerProvince
  ].filter(Boolean).join('   ');
  const items = invoiceData.items.map((item, index) => {
    const unitPrice = item.quantity ? item.valueSalesExcludingST / item.quantity : item.valueSalesExcludingST;
    const inclusiveValue = item.valueSalesExcludingST + item.salesTaxApplicable;
    return {
      serial: index + 1,
      description: `${item.hsCode} - ${item.productDescription}`,
      uom: item.uoM === 'Numbers, pieces, units' ? 'NOS' : item.uoM,
      quantity: item.quantity,
      unitPrice,
      exclusiveValue: item.valueSalesExcludingST,
      taxRate: item.rate,
      taxAmount: item.salesTaxApplicable,
      inclusiveValue
    };
  });
  const totalInclusive = totals.subtotal + totals.totalSalesTax;
  const totalAdvanceTax = invoiceData.items.reduce((sum, item) => sum + (item.salesTaxWithheldAtSource || 0), 0);
  const netTotal = totalInclusive + totalAdvanceTax;
  const amountInWords = amountToWords(netTotal);

  const panelTitleSx = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#222',
    mb: 0.3,
    textTransform: 'uppercase'
  };

  const infoRowSx = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 1.5,
    mb: 0.2
  };

  const smallLabelSx = {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#333'
  };

  const smallValueSx = {
    fontSize: '0.68rem',
    color: '#111'
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
        px: '0.28in',
        py: '0.18in',
        fontFamily: 'Arial, Helvetica, sans-serif',
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          px: '0.28in',
          py: '0.18in',
          boxShadow: 'none'
        }
      }}
    >
      <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', mb: 0.15 }}>
        {companyTopLine}
      </Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', mb: 0.15 }}>
        {invoiceData.sellerBusinessName}
      </Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '1.55rem', fontWeight: 700, letterSpacing: 0.3, mb: 0.35 }}>
        SALES TAX INVOICE
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
        <Box>
          <Typography sx={{ fontSize: '0.74rem' }}>
            <strong>Transaction No.:</strong> {invoiceData.invoiceRefNo || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', mt: 0.15 }}>
            <strong>Transaction Date:</strong> {invoiceDate}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', mt: 0.15 }}>
            <strong>FBR Invoice No.:</strong> {fbrInvoiceNo}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.74rem' }}>
            <strong>Transaction Type:</strong> {invoiceData.items[0]?.saleType || invoiceData.invoiceType || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', mt: 0.15 }}>
            <strong>Sale No. Ref.:</strong> {invoiceData.invoiceRefNo || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', mt: 0.15 }}>
            <strong>Buyer NTN / CNIC:</strong> {invoiceData.buyerNTNCNIC || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', mt: 0.15 }}>
            <strong>Buyer NIC:</strong> {invoiceData.buyerNIC || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 0.4 }}>
        <Box sx={{ width: '49%', border: '1px solid #777', p: 0.5, minHeight: '0.95in' }}>
          <Typography sx={panelTitleSx}>Supplier Details</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
            {invoiceData.sellerBusinessName || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', whiteSpace: 'pre-line', mb: 0.18 }}>
            {invoiceData.sellerAddress || 'N/A'}
          </Typography>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>Name:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.sellerBusinessName || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>Address:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.sellerProvince || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>NTN:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.sellerNTNCNIC || 'N/A'}</Typography>
          </Box>
        </Box>

        <Box sx={{ width: '49%', border: '1px solid #777', p: 0.5, minHeight: '0.95in' }}>
          <Typography sx={panelTitleSx}>Customer Details</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
            {invoiceData.buyerBusinessName || 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', whiteSpace: 'pre-line', mb: 0.18 }}>
            {invoiceData.buyerAddress || 'N/A'}
          </Typography>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>Name:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.buyerBusinessName || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>Address:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.buyerProvince || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>NIC:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.buyerNIC || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>NTN:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.buyerNTN || 'N/A'}</Typography>
          </Box>
          <Box sx={infoRowSx}>
            <Typography sx={smallLabelSx}>NTN / CNIC:</Typography>
            <Typography sx={smallValueSx}>{invoiceData.buyerNTNCNIC || 'N/A'}</Typography>
          </Box>
        </Box>
      </Box>

      <TableContainer sx={{ border: '1px solid #666', mb: 0.3 }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '5%', px: 0.35, py: 0.35 }}>S. #</TableCell>
              <TableCell sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '29%', px: 0.35, py: 0.35 }}>Description</TableCell>
              <TableCell sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '8%', px: 0.35, py: 0.35 }}>UOM</TableCell>
              <TableCell align="right" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '8%', px: 0.35, py: 0.35 }}>Quantity</TableCell>
              <TableCell align="right" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '10%', px: 0.35, py: 0.35 }}>Price</TableCell>
              <TableCell align="right" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '13%', px: 0.35, py: 0.35 }}>Taxes Exclusive Value</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '7%', px: 0.35, py: 0.35 }}>Tax Rate</TableCell>
              <TableCell align="right" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '10%', px: 0.35, py: 0.35 }}>Tax Amount</TableCell>
              <TableCell align="right" sx={{ border: '1px solid #777', fontSize: '0.68rem', fontWeight: 700, width: '10%', px: 0.35, py: 0.35 }}>Taxes Inclusive Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.serial}>
                <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{item.serial}</TableCell>
                <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{item.description}</TableCell>
                <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{item.uom}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{formatAmount(item.quantity)}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{formatAmount(item.unitPrice)}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{formatAmount(item.exclusiveValue)}</TableCell>
                <TableCell align="center" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{item.taxRate}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{formatAmount(item.taxAmount)}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid #ddd', fontSize: '0.68rem', px: 0.35, py: 0.28 }}>{formatAmount(item.inclusiveValue)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} sx={{ borderTop: '1px solid #666', fontSize: '0.72rem', fontWeight: 700, textAlign: 'right', px: 0.45, py: 0.4 }}>
                Total
              </TableCell>
              <TableCell align="right" sx={{ borderTop: '1px solid #666', fontSize: '0.72rem', fontWeight: 700, px: 0.45, py: 0.4 }}>
                {formatAmount(totals.subtotal)}
              </TableCell>
              <TableCell sx={{ borderTop: '1px solid #666' }} />
              <TableCell align="right" sx={{ borderTop: '1px solid #666', fontSize: '0.72rem', fontWeight: 700, px: 0.45, py: 0.4 }}>
                {formatAmount(totals.totalSalesTax)}
              </TableCell>
              <TableCell align="right" sx={{ borderTop: '1px solid #666', fontSize: '0.72rem', fontWeight: 700, px: 0.45, py: 0.4 }}>
                {formatAmount(totalInclusive)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontSize: '0.72rem', mb: 0.28 }}>
        {amountInWords}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 0.45 }}>
        <Box sx={{ width: '42%' }}>
          <Typography sx={{ fontSize: '0.72rem', mb: 0.15 }}>
            <strong>Remarks:</strong>
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', mb: 0.15 }}>
            <strong>Site Name:</strong> Head Office
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', mb: 0.15 }}>
            <strong>Store Name:</strong> Store 01
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 0.2 }}>
            <Box
              component="img"
              src="/fbr-digital-logo.png"
              alt="FBR Digital"
              sx={{ width: '0.9in', height: '0.9in', objectFit: 'contain', display: 'block' }}
            />
            <Box sx={{ '& canvas': { width: '0.9in !important', height: '0.9in !important', display: 'block' } }}>
              <QRCodeCanvas value={fbrInvoiceNo !== 'N/A' ? fbrInvoiceNo : invoiceData.invoiceRefNo || 'N/A'} size={72} level="H" includeMargin={false} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '40%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.22 }}>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Total Taxes Exclusive Value</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.22 }}>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Total Tax Amount @ 18%</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.totalSalesTax)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.22 }}>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Advance Income Tax</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totalAdvanceTax)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #777', pt: 0.22 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Net Total</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatAmount(netTotal)}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.35, pt: 0.55 }}>
        {['Prepared By', 'Authorized By', 'Approved By'].map((label) => (
          <Box key={label} sx={{ width: '30%', textAlign: 'center' }}>
            <Box sx={{ borderTop: '1px solid #555', mb: 0.12 }} />
            <Typography sx={{ fontSize: '0.72rem' }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.55, pt: 0.22, borderTop: '1px solid #ddd' }}>
        <Typography sx={{ fontSize: '0.68rem' }}>
          Print Date Time: {printDateTime}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem' }}>
          Page 1 of 1
        </Typography>
      </Box>
    </Box>
  );
};

const TemplateFour: React.FC<SalesInvoiceReportProps> = ({ invoiceData }) => {
  const totals = calculateTotals(invoiceData.items);
  const invoiceDate = format(new Date(invoiceData.invoiceDate), 'MMMM d, yyyy');
  const invoiceNo = invoiceData.invoiceRefNo || 'N/A';
  const customerId = invoiceData.buyerNTNCNIC || 'N/A';
  const poNumber = invoiceData.poNumber || 'N/A';
  const dueDate = invoiceDate;

  const headerBlue = '#0b4d73';
  const lightGray = '#f1f1f1';
  const borderColor = '#d2d2d2';

  const salesTaxRate = invoiceData.items.length ? parsePercentNumber(invoiceData.items[0].rate) : 0;
  const items = invoiceData.items.map((item) => {
    const unitPrice = item.quantity ? item.valueSalesExcludingST / item.quantity : item.valueSalesExcludingST;
    return {
      itemNo: item.hsCode,
      description: item.productDescription,
      qty: item.quantity,
      unitPrice,
      lineTotal: item.totalValues
    };
  });

  const desiredRows = 12;
  const emptyRows = Math.max(0, desiredRows - items.length);

  const subtotal = totals.subtotal;
  const salesTax = totals.totalSalesTax;
  const shippingHandling = 0;
  const discount = totals.totalDiscount;
  const total = subtotal + salesTax + shippingHandling - discount;

  const billToLines = [
    invoiceData.buyerBusinessName,
    invoiceData.buyerAddress,
    invoiceData.buyerProvince
  ].filter(Boolean);

  const sellerLines = [
    invoiceData.sellerAddress,
    invoiceData.sellerProvince
  ].filter(Boolean);

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        color: '#111',
        margin: '0 auto',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        px: '12mm',
        py: '10mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          px: '12mm',
          py: '10mm',
          boxShadow: 'none'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ width: '55%' }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
            {invoiceData.sellerBusinessName || 'My Company name'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#666', mt: 0.35 }}>
            {sellerLines.join('  ')}
          </Typography>

          <Box
            sx={{
              mt: 1.1,
              width: '70%',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#e6e6e6',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8d8d8d',
              fontSize: '0.95rem'
            }}
          >
            Insert Your Logo
          </Box>
        </Box>

        <Box sx={{ width: '42%', textAlign: 'right' }}>
          <Typography sx={{ fontSize: '1.55rem', fontWeight: 700, color: headerBlue, mb: 0.4 }}>
            Invoice
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1.2, rowGap: 0.45 }}>
            {[
              ['Date:', invoiceDate],
              ['Invoice #:', invoiceNo],
              ['Customer ID:', customerId],
              ['Purchase Order #', poNumber],
              ['Payment Due by:', dueDate]
            ].map(([label, value]) => (
              <React.Fragment key={label}>
                <Typography sx={{ fontSize: '0.72rem', color: '#333', textAlign: 'left' }}>{label}</Typography>
                <Box
                  sx={{
                    border: `1px solid ${borderColor}`,
                    backgroundColor: '#fff',
                    padding: '4px 6px',
                    fontSize: '0.72rem',
                    textAlign: 'left'
                  }}
                >
                  {value}
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
        <Box sx={{ width: '50%' }}>
          <Box sx={{ backgroundColor: headerBlue, color: '#fff', px: 1.2, py: 0.55, fontSize: '0.78rem', fontWeight: 700 }}>
            Bill To:
          </Box>
          <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', px: 1.2, py: 1.1, minHeight: '92px' }}>
            {billToLines.map((line) => (
              <Typography key={line} sx={{ fontSize: '0.74rem', color: '#222', mb: 0.2 }}>
                {line}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ width: '50%' }}>
          <Box sx={{ backgroundColor: headerBlue, color: '#fff', px: 1.2, py: 0.55, fontSize: '0.78rem', fontWeight: 700 }}>
            Ship To (If Different):
          </Box>
          <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', px: 1.2, py: 1.1, minHeight: '92px' }}>
            <Typography sx={{ fontSize: '0.74rem', color: '#666' }}> </Typography>
          </Box>
        </Box>
      </Box>

      <TableContainer sx={{ mt: 1.4 }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              {['Salesperson', 'Shipping Method', 'Shipping Terms', 'Payment Terms', 'Due Date', 'Delivery Date'].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    border: `1px solid ${borderColor}`,
                    backgroundColor: headerBlue,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    py: 0.65,
                    px: 0.7
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {['N/A', 'N/A', 'N/A', 'N/A', invoiceDate, 'N/A'].map((value, idx) => (
                <TableCell
                  key={idx}
                  sx={{
                    border: `1px solid ${borderColor}`,
                    fontSize: '0.68rem',
                    py: 0.55,
                    px: 0.7
                  }}
                >
                  {value}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer sx={{ mt: 1.2, flexGrow: 1 }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: `1px solid ${borderColor}`, backgroundColor: headerBlue, color: '#fff', fontWeight: 700, fontSize: '0.7rem', width: '12%', py: 0.65, px: 0.8 }}>
                Item #
              </TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, backgroundColor: headerBlue, color: '#fff', fontWeight: 700, fontSize: '0.7rem', width: '52%', py: 0.65, px: 0.8 }}>
                Description
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, backgroundColor: headerBlue, color: '#fff', fontWeight: 700, fontSize: '0.7rem', width: '10%', py: 0.65, px: 0.8 }}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, backgroundColor: headerBlue, color: '#fff', fontWeight: 700, fontSize: '0.7rem', width: '13%', py: 0.65, px: 0.8 }}>
                Unit Price
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, backgroundColor: headerBlue, color: '#fff', fontWeight: 700, fontSize: '0.7rem', width: '13%', py: 0.65, px: 0.8 }}>
                Line Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={`${item.itemNo}-${idx}`} sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : lightGray }}>
                <TableCell sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.55, px: 0.8 }}>
                  {item.itemNo}
                </TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.55, px: 0.8 }}>
                  {item.description}
                </TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.55, px: 0.8 }}>
                  {formatAmount(item.qty)}
                </TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.55, px: 0.8 }}>
                  {formatAmount(item.unitPrice)}
                </TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.55, px: 0.8 }}>
                  {formatAmount(item.lineTotal)}
                </TableCell>
              </TableRow>
            ))}

            {Array.from({ length: emptyRows }).map((_, idx) => {
              const rowIndex = items.length + idx;
              return (
                <TableRow key={`empty-${idx}`} sx={{ backgroundColor: rowIndex % 2 === 0 ? '#fff' : lightGray }}>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.55, px: 0.8 }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.55, px: 0.8 }} />
                  <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.55, px: 0.8 }} />
                  <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.55, px: 0.8 }} />
                  <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.55, px: 0.8 }} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1.4 }}>
        <Box sx={{ width: '60%' }}>
          <Box sx={{ backgroundColor: headerBlue, color: '#fff', px: 1.2, py: 0.55, fontSize: '0.76rem', fontWeight: 700 }}>
            Special Notes and Instructions
          </Box>
          <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', height: '92px', px: 1.2, py: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#666' }}> </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '36%' }}>
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
            <TableBody>
              {[
                ['Subtotal', subtotal],
                ['Sales Tax Rate %', salesTaxRate],
                ['Sales Tax', salesTax],
                ['S&H', shippingHandling],
                ['Discount', discount]
              ].map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.45, px: 0.8 }}>
                    {label}
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, width: '12%', fontSize: '0.7rem', py: 0.45, px: 0.4, textAlign: 'center' }}>
                    {label === 'Sales Tax Rate %' ? '%' : '$'}
                  </TableCell>
                  <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, fontSize: '0.7rem', py: 0.45, px: 0.8 }}>
                    {label === 'Sales Tax Rate %' ? Number(value).toFixed(2) : formatAmount(Number(value))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ border: `1px solid ${borderColor}`, fontSize: '0.74rem', fontWeight: 700, py: 0.55, px: 0.8 }}>
                  Total
                </TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}`, width: '12%', fontSize: '0.74rem', fontWeight: 700, py: 0.55, px: 0.4, textAlign: 'center' }}>
                  $
                </TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${borderColor}`, fontSize: '0.74rem', fontWeight: 700, py: 0.55, px: 0.8 }}>
                  {formatAmount(total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: '#333', mt: 1.2 }}>
          Make all checks payable to {invoiceData.sellerBusinessName || 'My Company name'}
        </Typography>
        <Typography sx={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, mt: 0.55 }}>
          Thank you for your business!
        </Typography>
        <Divider sx={{ mt: 1.2, mb: 0.7 }} />
        <Typography sx={{ textAlign: 'center', fontSize: '0.68rem', color: '#333' }}>
          {sellerLines.join('   ')}
        </Typography>
      </Box>
    </Box>
  );
};

const SalesInvoiceReport: React.FC<SalesInvoiceReportProps> = (props) => {
  if (props.template === 'template2') {
    return <TemplateTwo {...props} />;
  }

  if (props.template === 'template3') {
    return <TemplateThree {...props} />;
  }

  if (props.template === 'template4') {
    return <TemplateFour {...props} />;
  }

  return <TemplateOne {...props} />;
};

export default SalesInvoiceReport;
