import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { format as formatDateFns } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import reportsApi, { PurchaseRegisterData, PurchaseRegisterRow } from '../services/reportsApi';
import { formatCurrency } from '../utils/formatUtils';

type Align = 'left' | 'right' | 'center';

interface ColumnDef {
  key: keyof PurchaseRegisterRow | 'serial';
  label: string;
  /** Column width in mm, used by the PDF export. The set sums to 277mm (A4 landscape minus margins). */
  pdfWidth: number;
  /** Approximate character width, used by the Excel export. */
  excelWidth: number;
  align: Align;
  numeric?: boolean;
}

/**
 * Single source of truth for the register layout. The on-screen table, the Excel
 * export and the PDF export all derive from this, so they cannot drift apart.
 */
const COLUMNS: ColumnDef[] = [
  { key: 'serial', label: 'S. No', pdfWidth: 9, excelWidth: 6, align: 'center' },
  { key: 'purchaseDate', label: 'Date', pdfWidth: 17, excelWidth: 12, align: 'center' },
  { key: 'invoiceNo', label: 'Invoice #', pdfWidth: 16, excelWidth: 12, align: 'center' },
  { key: 'vendorName', label: 'Company Name', pdfWidth: 38, excelWidth: 32, align: 'left' },
  { key: 'regNo', label: 'Reg #', pdfWidth: 22, excelWidth: 16, align: 'left' },
  { key: 'hsCode', label: 'HS Codes', pdfWidth: 19, excelWidth: 14, align: 'center' },
  { key: 'productName', label: 'Product Name', pdfWidth: 50, excelWidth: 44, align: 'left' },
  { key: 'quantity', label: 'Qty', pdfWidth: 15, excelWidth: 10, align: 'right', numeric: true },
  { key: 'unit', label: 'Unit', pdfWidth: 13, excelWidth: 12, align: 'center' },
  { key: 'valueExcludingST', label: 'Exc Value', pdfWidth: 22, excelWidth: 15, align: 'right', numeric: true },
  { key: 'taxRate', label: 'Rate', pdfWidth: 12, excelWidth: 9, align: 'right', numeric: true },
  { key: 'salesTax', label: 'S.Tax', pdfWidth: 20, excelWidth: 14, align: 'right', numeric: true },
  { key: 'valueIncludingST', label: 'Inc Value', pdfWidth: 24, excelWidth: 16, align: 'right', numeric: true }
];

const PDF_TABLE_WIDTH = COLUMNS.reduce((sum, column) => sum + column.pdfWidth, 0);

/**
 * Columns shown on the grand total row. Quantity is deliberately absent: units
 * differ line to line, so a single sum of them would be meaningless.
 */
const TOTAL_KEYS = ['valueExcludingST', 'taxRate', 'salesTax', 'valueIncludingST'] as const;

/**
 * Pakistan's tax year runs July to June, which is how this register is normally
 * pulled, so the default range is the fiscal year containing today.
 */
const currentFiscalYear = () => {
  const today = new Date();
  const startYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    startDate: `${startYear}-07-01`,
    endDate: `${startYear + 1}-06-30`
  };
};

const safeFormatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatDateFns(date, 'dd/MM/yyyy');
};

const formatMoney = (value: number) => (value === 0 ? '-' : formatCurrency(value));

const formatQuantity = (value: number) =>
  value === 0 ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 4 });

/** Trailing zeros are dropped so a flat 18% does not read as "18.00%". */
const formatRate = (value: number) => (value === 0 ? '-' : `${Number(value.toFixed(2))}%`);

/** Display text for one cell. Shared by the table and the PDF export. */
const cellText = (row: PurchaseRegisterRow, column: ColumnDef, serial: number): string => {
  if (column.key === 'serial') return String(serial);
  if (column.key === 'purchaseDate') return safeFormatDate(row.purchaseDate);
  if (column.key === 'quantity') return formatQuantity(row.quantity);
  if (column.key === 'taxRate') return formatRate(row.taxRate);
  if (column.numeric) return formatMoney(row[column.key] as number);
  return String(row[column.key] ?? '');
};

/** Display text for one cell of the grand total row. */
const totalText = (column: ColumnDef, totals: PurchaseRegisterData['totals']): string => {
  if (column.key === 'vendorName') return 'GRAND TOTAL';
  if (!column.numeric || !(TOTAL_KEYS as readonly string[]).includes(column.key)) return '';
  const total = totals[column.key as (typeof TOTAL_KEYS)[number]];
  return column.key === 'taxRate' ? formatRate(total) : formatMoney(total);
};

const PurchaseRegister: React.FC = () => {
  const [range, setRange] = useState(currentFiscalYear);
  const [data, setData] = useState<PurchaseRegisterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    const from = safeFormatDate(range.startDate);
    const to = safeFormatDate(range.endDate);
    if (!from && !to) return 'ALL DATES';
    return `FOR THE PERIOD ${from || 'BEGINNING'} TO ${to || 'DATE'}`;
  }, [range.startDate, range.endDate]);

  const fetchRegister = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Super admins operate against the company selected elsewhere in the app
      const selectedCompanyId = localStorage.getItem('selectedCompanyId') || undefined;
      const response = await reportsApi.getPurchaseRegister(
        { startDate: range.startDate, endDate: range.endDate },
        selectedCompanyId
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        setError(response.error || response.message || 'Failed to load purchase register');
      }
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load purchase register');
    } finally {
      setLoading(false);
    }
  }, [range.startDate, range.endDate]);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  const rows = data?.rows ?? [];
  const hasRows = rows.length > 0;

  const fileStem = useMemo(() => {
    const from = range.startDate || 'all';
    const to = range.endDate || 'all';
    return `Purchase-Register_${from}_to_${to}`;
  }, [range.startDate, range.endDate]);

  const exportExcel = () => {
    if (!data || !hasRows) return;

    // Numbers stay numeric so the sheet can be filtered and re-totalled in Excel
    const sheetRows: (string | number)[][] = [
      [data.company.name || 'Purchase Register'],
      ['PURCHASE REGISTER'],
      [periodLabel],
      [],
      COLUMNS.map((column) => column.label),
      ...rows.map((row, index) =>
        COLUMNS.map((column) => {
          if (column.key === 'serial') return index + 1;
          if (column.key === 'purchaseDate') return safeFormatDate(row.purchaseDate);
          if (column.numeric) return row[column.key] as number;
          return String(row[column.key] ?? '');
        })
      ),
      COLUMNS.map((column) => {
        if (column.key === 'vendorName') return 'GRAND TOTAL';
        if (column.numeric && (TOTAL_KEYS as readonly string[]).includes(column.key)) {
          return data.totals[column.key as (typeof TOTAL_KEYS)[number]];
        }
        return '';
      })
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet['!cols'] = COLUMNS.map((column) => ({ wch: column.excelWidth }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Register');
    XLSX.writeFile(workbook, `${fileStem}.xlsx`);
  };

  const exportPdf = () => {
    if (!data || !hasRows) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 10;
    const bottomLimit = pageHeight - 12;
    const headerHeight = 6;
    const rowHeight = 4.4;
    const padding = 1;

    let cursorY = 0;
    let blockTop = 0;
    let rowEdges: number[] = [];

    /** Trim text to fit a column, appending an ellipsis when it overflows. */
    const fit = (text: string, width: number) => {
      const available = width - padding * 2;
      let value = text ?? '';
      if (doc.getTextWidth(value) <= available) return value;
      while (value.length > 1 && doc.getTextWidth(`${value}..`) > available) {
        value = value.slice(0, -1);
      }
      return `${value}..`;
    };

    const putText = (
      text: string,
      x: number,
      top: number,
      width: number,
      height: number,
      align: Align
    ) => {
      const baseline = top + height - 1.5;
      const value = fit(text, width);
      if (align === 'right') {
        doc.text(value, x + width - padding, baseline, { align: 'right' });
      } else if (align === 'center') {
        doc.text(value, x + width / 2, baseline, { align: 'center' });
      } else {
        doc.text(value, x + padding, baseline);
      }
    };

    const drawTitles = () => {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(data.company.name || 'Purchase Register', marginX, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('PURCHASE REGISTER', marginX, 17);
      doc.text(periodLabel, marginX, 21);
      if (data.company.ntnNumber) {
        doc.text(`N.T.N: ${data.company.ntnNumber}`, marginX, 25);
      }
    };

    const drawColumnHeader = (top: number) => {
      doc.setFillColor(226, 240, 217);
      doc.rect(marginX, top, PDF_TABLE_WIDTH, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(150, 0, 0);

      let x = marginX;
      COLUMNS.forEach((column) => {
        putText(column.label, x, top, column.pdfWidth, headerHeight, 'center');
        x += column.pdfWidth;
      });

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    };

    /** Draw the grid for the block of rows just laid out on this page. */
    const closeBlock = () => {
      if (rowEdges.length === 0) return;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.1);

      const blockBottom = rowEdges[rowEdges.length - 1];
      rowEdges.forEach((edgeY) => {
        doc.line(marginX, edgeY, marginX + PDF_TABLE_WIDTH, edgeY);
      });

      let x = marginX;
      doc.line(x, blockTop, x, blockBottom);
      COLUMNS.forEach((column) => {
        x += column.pdfWidth;
        doc.line(x, blockTop, x, blockBottom);
      });

      rowEdges = [];
    };

    const startPage = (isFirst: boolean) => {
      if (!isFirst) doc.addPage();
      drawTitles();
      cursorY = 29;
      blockTop = cursorY;
      rowEdges = [cursorY];
      drawColumnHeader(cursorY);
      cursorY += headerHeight;
      rowEdges.push(cursorY);
    };

    startPage(true);
    doc.setFontSize(6);

    rows.forEach((row, index) => {
      if (cursorY + rowHeight > bottomLimit) {
        closeBlock();
        startPage(false);
        doc.setFontSize(6);
      }

      let x = marginX;
      COLUMNS.forEach((column) => {
        putText(
          cellText(row, column, index + 1),
          x,
          cursorY,
          column.pdfWidth,
          rowHeight,
          column.align
        );
        x += column.pdfWidth;
      });

      cursorY += rowHeight;
      rowEdges.push(cursorY);
    });

    // Totals row, kept with the table rather than orphaned on a new page
    if (cursorY + rowHeight > bottomLimit) {
      closeBlock();
      startPage(false);
      doc.setFontSize(6);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(235, 235, 235);
    doc.rect(marginX, cursorY, PDF_TABLE_WIDTH, rowHeight, 'F');

    let totalsX = marginX;
    COLUMNS.forEach((column) => {
      putText(
        totalText(column, data.totals),
        totalsX,
        cursorY,
        column.pdfWidth,
        rowHeight,
        column.align
      );
      totalsX += column.pdfWidth;
    });

    cursorY += rowHeight;
    rowEdges.push(cursorY);
    closeBlock();
    doc.setFont('helvetica', 'normal');

    // Page numbers, added once the total page count is known
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(7);
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.text(
        `Page ${page} of ${pageCount}`,
        marginX + PDF_TABLE_WIDTH,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    doc.save(`${fileStem}.pdf`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Purchase Register
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Detail of purchases, one row per purchase line item.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            label="From"
            type="date"
            size="small"
            value={range.startDate}
            onChange={(event) => setRange((prev) => ({ ...prev, startDate: event.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={range.endDate}
            onChange={(event) => setRange((prev) => ({ ...prev, endDate: event.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={fetchRegister} disabled={loading}>
            Apply
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={exportExcel}
            disabled={loading || !hasRows}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={exportPdf}
            disabled={loading || !hasRows}
          >
            Export PDF
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !hasRows && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No purchases found for the selected period.
            </Typography>
          </Box>
        )}

        {!loading && hasRows && data && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{data.company.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                PURCHASE REGISTER
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {periodLabel}
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 620 }}>
              <Table size="small" stickyHeader sx={{ minWidth: 1500 }}>
                <TableHead>
                  <TableRow>
                    {COLUMNS.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align}
                        sx={{
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          backgroundColor: '#e2f0d9'
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`${row.invoiceNo}-${index}`} hover>
                      {COLUMNS.map((column) => (
                        <TableCell
                          key={column.key}
                          align={column.align}
                          sx={{
                            whiteSpace: column.align === 'left' ? 'normal' : 'nowrap',
                            fontVariantNumeric: column.numeric ? 'tabular-nums' : undefined
                          }}
                        >
                          {cellText(row, column, index + 1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  <TableRow>
                    {COLUMNS.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align}
                        sx={{
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          backgroundColor: '#f0f0f0'
                        }}
                      >
                        {totalText(column, data.totals)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {rows.length} line item{rows.length === 1 ? '' : 's'}
            </Typography>
          </>
        )}
      </Paper>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseRegister;
