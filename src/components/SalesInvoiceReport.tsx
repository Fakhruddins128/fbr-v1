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
  const headerTitleSx = {
    border: '3px solid #000',
    textAlign: 'center' as const,
    fontSize: '0.82rem',
    fontWeight: 700,
    lineHeight: 1.1,
    py: 0.3,
    mb: 0.9,
    backgroundColor: '#f5f5f5'
  };
  const headerBodySx = {
    border: '1.5px solid #000',
    backgroundColor: '#ececec',
    minHeight: 138,
    px: 2,
    py: 1.2,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between'
  };

  return (
    <Box sx={{
      backgroundColor: '#fff',
      color: '#000',
      p: 2.5,
      margin: '0 auto',
      width: '100%',
      maxWidth: '210mm',
      border: '0',
      fontFamily: '"Times New Roman", serif',
      '@media print': {
        border: '0',
        boxShadow: 'none'
      }
    }}>
      <Box sx={{ textAlign: 'center', mb: 1.25 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1.1 }}>
          Sales Tax Invoice
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.92rem' }}>
            Invoice No. :
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, textDecoration: 'underline' }}>
            {invoiceData.invoiceRefNo || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.92rem' }}>
            Date :
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, textDecoration: 'underline' }}>
            {format(new Date(invoiceData.invoiceDate), 'dd/MM/yyyy')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mb: 2 }}>
        <Box sx={{ width: '50%' }}>
          <Box sx={headerTitleSx}>
            SELLER NAME & ADDRESS
          </Box>
          <Box sx={headerBodySx}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline', mb: 0.5 }}>
                {invoiceData.sellerBusinessName}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.35 }}>
                {invoiceData.sellerAddress}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mt: 0.35 }}>
                {invoiceData.sellerProvince}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1.2 }}>
              <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.4 }}>
                SALES TAX REG NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.4 }}>
                N T N REG NO. : <strong>{invoiceData.sellerNTNCNIC || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '50%' }}>
          <Box sx={headerTitleSx}>
            BUYER NAME & ADDRESS
          </Box>
          <Box sx={headerBodySx}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, textDecoration: 'underline', mb: 0.5 }}>
                {invoiceData.buyerBusinessName}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.35 }}>
                {invoiceData.buyerAddress}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mt: 0.35 }}>
                {invoiceData.buyerProvince}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1.2 }}>
              <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.4 }}>
                SALES TAX REG NO. : <strong>{invoiceData.buyerNTNCNIC || 'N/A'}</strong>
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.4 }}>
                N T N REG NO. : <strong>{invoiceData.buyerNTNCNIC || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, fontSize: '0.76rem' }}>
        <Typography sx={{ fontSize: '0.76rem' }}>
          <strong>Buyer Registration Type :</strong> {invoiceData.buyerRegistrationType}
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.76rem' }}>
            <strong>PO No. :</strong> {invoiceData.poNumber || 'N/A'}
          </Typography>
          {fbrResponse?.invoiceNumber && (
            <Typography sx={{ fontSize: '0.72rem' }}>
              <strong>FBR Ref :</strong> {fbrResponse.invoiceNumber}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ borderTop: '3px solid #000', mb: 1.2 }} />

      <TableContainer sx={{ mb: 1.5 }}>
        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '10%', textAlign: 'center' }}>Quantity</TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '8%', textAlign: 'center' }}>H. S.<br />CODE</TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '30%', textAlign: 'center' }}>Description Of Goods</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '10%' }}>Unit Price</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '14%' }}>Val. Excl.<br />S.Tax</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '7%' }}>Rate Of<br />S. Tax</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '10%' }}>Sales Tax</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.7rem', fontWeight: 700, px: 0.55, py: 0.45, width: '11%' }}>Val. Incl.<br />S.Tax</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items.map((item, index) => {
              const unitPrice = item.quantity ? item.valueSalesExcludingST / item.quantity : item.valueSalesExcludingST;
              const valueIncludingTax = item.valueSalesExcludingST + item.salesTaxApplicable;

              return (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45, textAlign: 'center' }}>{item.quantity}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45, textAlign: 'center' }}>{item.hsCode}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{item.productDescription}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{formatAmount(unitPrice)}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{formatAmount(item.valueSalesExcludingST)}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{item.rate}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{formatAmount(item.salesTaxApplicable)}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.72rem', px: 0.55, py: 0.45 }}>{formatAmount(valueIncludingTax)}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={4} sx={{ border: '1px solid #000', fontSize: '0.75rem', fontWeight: 700, px: 0.55, py: 0.7 }}>
                Total Amount :
              </TableCell>
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.75rem', fontWeight: 700, px: 0.55, py: 0.7 }}>
                {formatAmount(totals.subtotal)}
              </TableCell>
              <TableCell sx={{ border: '1px solid #000', fontSize: '0.75rem', px: 0.55, py: 0.7 }} />
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.75rem', fontWeight: 700, px: 0.55, py: 0.7 }}>
                {formatAmount(totals.totalSalesTax)}
              </TableCell>
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.75rem', fontWeight: 700, px: 0.55, py: 0.7 }}>
                {formatAmount(totals.subtotal + totals.totalSalesTax)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '0.76rem' }}>
            Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 180 }}>
          <Typography sx={{ fontSize: '0.78rem', mb: 3 }}>
            For {invoiceData.sellerBusinessName}
          </Typography>
          <Divider sx={{ borderColor: '#000' }} />
          <Typography sx={{ fontSize: '0.72rem', mt: 0.6 }}>
            Authorized Signature
          </Typography>
        </Box>
      </Box>
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
