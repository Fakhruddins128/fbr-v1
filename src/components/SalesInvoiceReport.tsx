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
  const metaBoxSx = {
    border: '2px solid #000',
    px: 1.2,
    py: 0.8,
    minHeight: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };
  const partyHeaderSx = {
    border: '2px solid #000',
    borderBottom: '0',
    textAlign: 'center' as const,
    py: 0.45,
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: 0.4,
    backgroundColor: '#f4f4f4'
  };
  const partyBodySx = {
    border: '2px solid #000',
    minHeight: 160,
    px: 1.5,
    py: 1.1
  };

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        color: '#000',
        p: 2,
        margin: '0 auto',
        width: '100%',
        maxWidth: '210mm',
        fontFamily: '"Times New Roman", serif',
        '@media print': {
          p: 1.5,
          boxShadow: 'none'
        }
      }}
    >
      <Box sx={{ border: '3px solid #000', px: 1.5, py: 1.1, mb: 1.25 }}>
        <Typography sx={{ textAlign: 'center', fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.05 }}>
          SALES TAX INVOICE
        </Typography>
        <Typography sx={{ textAlign: 'center', fontSize: '0.76rem', mt: 0.35 }}>
          Original / Customer Copy
        </Typography>
      </Box>

      <Grid container spacing={1.1} sx={{ mb: 1.2 }}>
        <Grid size={{ xs: 6 }}>
          <Box sx={metaBoxSx}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>Invoice No.</Typography>
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>{invoiceData.invoiceRefNo || 'N/A'}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Box sx={metaBoxSx}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>Invoice Date</Typography>
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>{invoiceDate}</Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
        <Grid size={{ xs: 6 }}>
          <Box sx={partyHeaderSx}>SELLER NAME & ADDRESS</Box>
          <Box sx={partyBodySx}>
            <Typography sx={{ fontSize: '0.96rem', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', mb: 0.8 }}>
              {invoiceData.sellerBusinessName}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.4, textAlign: 'center', whiteSpace: 'pre-line' }}>
              {invoiceData.sellerAddress}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.4, textAlign: 'center', mt: 0.4 }}>
              {invoiceData.sellerProvince}
            </Typography>
            <Box sx={{ mt: 1.5, borderTop: '1px solid #000', pt: 0.8 }}>
              <Typography sx={{ fontSize: '0.74rem', lineHeight: 1.5 }}>
                <strong>Sales Tax Reg. No:</strong> {invoiceData.sellerNTNCNIC || 'N/A'}
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', lineHeight: 1.5 }}>
                <strong>NTN / CNIC:</strong> {invoiceData.sellerNTNCNIC || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Box sx={partyHeaderSx}>BUYER NAME & ADDRESS</Box>
          <Box sx={partyBodySx}>
            <Typography sx={{ fontSize: '0.96rem', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', mb: 0.8 }}>
              {invoiceData.buyerBusinessName}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.4, textAlign: 'center', whiteSpace: 'pre-line' }}>
              {invoiceData.buyerAddress}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.4, textAlign: 'center', mt: 0.4 }}>
              {invoiceData.buyerProvince}
            </Typography>
            <Box sx={{ mt: 1.5, borderTop: '1px solid #000', pt: 0.8 }}>
              <Typography sx={{ fontSize: '0.74rem', lineHeight: 1.5 }}>
                <strong>Sales Tax Reg. No:</strong> {invoiceData.buyerNTNCNIC || 'N/A'}
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', lineHeight: 1.5 }}>
                <strong>Buyer Type:</strong> {invoiceData.buyerRegistrationType || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.1} sx={{ mb: 1.3 }}>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ ...metaBoxSx, minHeight: 36 }}>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>PO No.</Typography>
            <Typography sx={{ fontSize: '0.76rem' }}>{invoiceData.poNumber || 'N/A'}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ ...metaBoxSx, minHeight: 36 }}>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>Scenario</Typography>
            <Typography sx={{ fontSize: '0.76rem' }}>{invoiceData.scenarioId || 'N/A'}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ ...metaBoxSx, minHeight: 36 }}>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700 }}>FBR Ref.</Typography>
            <Typography sx={{ fontSize: '0.76rem' }}>{fbrResponse?.invoiceNumber || 'N/A'}</Typography>
          </Box>
        </Grid>
      </Grid>

      <TableContainer sx={{ mb: 1.2 }}>
        <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '6%', textAlign: 'center' }}>S#</TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '10%', textAlign: 'center' }}>Quantity</TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '11%', textAlign: 'center' }}>HS Code</TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '27%', textAlign: 'center' }}>Description Of Goods</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '8%' }}>UoM</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '10%' }}>Unit Price</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '11%' }}>Value Excl. S.T.</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '7%' }}>Rate</TableCell>
              <TableCell align="center" sx={{ border: '2px solid #000', fontSize: '0.68rem', fontWeight: 700, px: 0.45, py: 0.55, width: '10%' }}>Sales Tax</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items.map((item, index) => {
              const unitPrice = item.quantity ? item.valueSalesExcludingST / item.quantity : item.valueSalesExcludingST;
              return (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45, textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45, textAlign: 'center' }}>{item.quantity}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45, textAlign: 'center' }}>{item.hsCode}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45 }}>{item.productDescription}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45, textAlign: 'center' }}>{item.uoM}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45 }}>{formatAmount(unitPrice)}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45 }}>{formatAmount(item.valueSalesExcludingST)}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45, textAlign: 'center' }}>{item.rate}</TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #000', fontSize: '0.7rem', px: 0.45, py: 0.45 }}>{formatAmount(item.salesTaxApplicable)}</TableCell>
                </TableRow>
              );
            })}

            <TableRow>
              <TableCell colSpan={6} sx={{ border: '2px solid #000', fontSize: '0.73rem', fontWeight: 700, px: 0.45, py: 0.65 }}>
                TOTAL AMOUNT
              </TableCell>
              <TableCell align="right" sx={{ border: '2px solid #000', fontSize: '0.73rem', fontWeight: 700, px: 0.45, py: 0.65 }}>
                {formatAmount(totals.subtotal)}
              </TableCell>
              <TableCell sx={{ border: '2px solid #000', fontSize: '0.73rem', px: 0.45, py: 0.65 }} />
              <TableCell align="right" sx={{ border: '2px solid #000', fontSize: '0.73rem', fontWeight: 700, px: 0.45, py: 0.65 }}>
                {formatAmount(totals.totalSalesTax)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={1.2} sx={{ mb: 1.3 }}>
        <Grid size={{ xs: 7.5 }}>
          <Box sx={{ border: '2px solid #000', minHeight: 92, px: 1.2, py: 0.9 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>Remarks / Notes</Typography>
            <Typography sx={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
              Buyer Type: {invoiceData.buyerRegistrationType || 'N/A'}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
              FBR Invoice No: {fbrResponse?.invoiceNumber || 'N/A'}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
              This is a computer generated sales tax invoice.
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4.5 }}>
          <Box sx={{ border: '2px solid #000' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', px: 1, py: 0.65 }}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Subtotal</Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', px: 1, py: 0.65 }}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Sales Tax</Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.totalSalesTax)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', px: 1, py: 0.65 }}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>FED</Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.totalFED)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', px: 1, py: 0.65 }}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Discount</Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700 }}>{formatAmount(totals.totalDiscount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.8, backgroundColor: '#f4f4f4' }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>Grand Total</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{formatAmount(totals.grandTotal)}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2.1 }}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem' }}>
            Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
          </Typography>
        </Box>
        <Box sx={{ width: 210, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 3.5 }}>
            For {invoiceData.sellerBusinessName}
          </Typography>
          <Divider sx={{ borderColor: '#000' }} />
          <Typography sx={{ fontSize: '0.72rem', mt: 0.55 }}>
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
