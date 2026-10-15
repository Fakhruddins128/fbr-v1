import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
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
  Inventory2 as Inventory2Icon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { format as formatDateFns } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import reportsApi, {
  InventoryData,
  InventoryItemRow,
  InventoryRow
} from '../services/reportsApi';
import { formatCurrency } from '../utils/formatUtils';

type Align = 'left' | 'right' | 'center';

interface ColumnDef {
  key: keyof InventoryRow | 'serial';
  label: string;
  /** Column width in mm, used by the PDF export. The set sums to 277mm (A4 landscape minus margins). */
  pdfWidth: number;
  /** Approximate character width, used by the Excel export. */
  excelWidth: number;
  align: Align;
  numeric?: boolean;
  /** Stock movement columns, which are quantities rather than money. */
  quantity?: boolean;
}

/**
 * Single source of truth for the report layout. The on-screen table, the Excel
 * export and the PDF export all derive from this, so they cannot drift apart.
 */
const COLUMNS: ColumnDef[] = [
  { key: 'serial', label: 'S. No', pdfWidth: 10, excelWidth: 6, align: 'center' },
  { key: 'hsCode', label: 'HS Code', pdfWidth: 24, excelWidth: 16, align: 'center' },
  { key: 'description', label: 'Description', pdfWidth: 78, excelWidth: 50, align: 'left' },
  { key: 'itemCount', label: 'Items', pdfWidth: 14, excelWidth: 8, align: 'right', numeric: true },
  { key: 'unit', label: 'Unit', pdfWidth: 26, excelWidth: 20, align: 'center' },
  { key: 'openingStock', label: 'Opening', pdfWidth: 25, excelWidth: 14, align: 'right', numeric: true, quantity: true },
  { key: 'purchased', label: 'Purchased', pdfWidth: 25, excelWidth: 14, align: 'right', numeric: true, quantity: true },
  { key: 'sold', label: 'Sold', pdfWidth: 25, excelWidth: 14, align: 'right', numeric: true, quantity: true },
  { key: 'balance', label: 'Balance', pdfWidth: 25, excelWidth: 14, align: 'right', numeric: true, quantity: true },
  { key: 'value', label: 'Value', pdfWidth: 25, excelWidth: 16, align: 'right', numeric: true }
];

const PDF_TABLE_WIDTH = COLUMNS.reduce((sum, column) => sum + column.pdfWidth, 0);

interface ItemColumnDef {
  key: keyof InventoryItemRow;
  label: string;
  align: Align;
  numeric?: boolean;
  quantity?: boolean;
}

/**
 * Columns of the expanded per-item table. These mirror the group columns minus
 * HS Code, which the parent row already states, and Items, which is always 1.
 * On-screen only: the Excel and PDF exports stay at group level.
 */
const ITEM_COLUMNS: ItemColumnDef[] = [
  { key: 'description', label: 'Description', align: 'left' },
  { key: 'unit', label: 'Unit', align: 'center' },
  { key: 'unitPrice', label: 'Unit Price', align: 'right', numeric: true },
  { key: 'openingStock', label: 'Opening', align: 'right', numeric: true, quantity: true },
  { key: 'purchased', label: 'Purchased', align: 'right', numeric: true, quantity: true },
  { key: 'sold', label: 'Sold', align: 'right', numeric: true, quantity: true },
  { key: 'balance', label: 'Balance', align: 'right', numeric: true, quantity: true },
  { key: 'value', label: 'Value', align: 'right', numeric: true }
];

/** Columns always shown on the grand total row. */
const BASE_TOTAL_KEYS = ['itemCount', 'value'] as const;

/** Quantity columns, totalled only when every group shares one unit. */
const QUANTITY_TOTAL_KEYS = ['openingStock', 'purchased', 'sold', 'balance'] as const;

const safeFormatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatDateFns(date, 'dd/MM/yyyy');
};

const formatMoney = (value: number) => (value === 0 ? '-' : formatCurrency(value));

const formatQuantity = (value: number) =>
  value === 0 ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 4 });

/** Display text for one cell. Shared by the table and the PDF export. */
const cellText = (row: InventoryRow, column: ColumnDef, serial: number): string => {
  if (column.key === 'serial') return String(serial);
  if (column.key === 'itemCount') return String(row.itemCount);
  if (column.key === 'value') return formatMoney(row.value);
  if (column.quantity) return formatQuantity(row[column.key] as number);
  return String(row[column.key] ?? '');
};

/** Display text for one cell of the expanded per-item table. */
const itemCellText = (item: InventoryItemRow, column: ItemColumnDef): string => {
  if (column.key === 'unitPrice' || column.key === 'value') {
    return formatMoney(item[column.key]);
  }
  if (column.quantity) return formatQuantity(item[column.key] as number);
  return String(item[column.key] ?? '');
};

const InventoryReport: React.FC = () => {
  // Blank means stock as it stands now, which matches the Items page exactly.
  const [asOf, setAsOf] = useState('');
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((hsCode: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (!next.delete(hsCode)) next.add(hsCode);
      return next;
    });
  }, []);

  const periodLabel = useMemo(() => {
    const on = safeFormatDate(asOf);
    return on ? `STOCK AS AT ${on}` : 'CURRENT STOCK';
  }, [asOf]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Super admins operate against the company selected elsewhere in the app
      const selectedCompanyId = localStorage.getItem('selectedCompanyId') || undefined;
      const response = await reportsApi.getInventoryReport(
        { asOf: asOf || undefined },
        selectedCompanyId
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        setError(response.error || response.message || 'Failed to load inventory report');
      }
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Memoised because the unit check below depends on it; a fresh [] each
  // render would re-run that work every time.
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const hasRows = rows.length > 0;

  /**
   * Quantities are only summed when every group reports the same unit. Adding
   * kilograms to litres would produce a number that means nothing.
   */
  const unitsAgree = useMemo(() => {
    const units = new Set(rows.map((row) => row.unit).filter(Boolean));
    return units.size <= 1 && !units.has('Mixed');
  }, [rows]);

  const totalKeys = useMemo<readonly string[]>(
    () => (unitsAgree ? [...BASE_TOTAL_KEYS, ...QUANTITY_TOTAL_KEYS] : BASE_TOTAL_KEYS),
    [unitsAgree]
  );

  /** Display text for one cell of the grand total row. */
  const totalText = useCallback(
    (column: ColumnDef, totals: InventoryData['totals']): string => {
      if (column.key === 'description') return 'GRAND TOTAL';
      if (!column.numeric || !totalKeys.includes(column.key)) return '';
      const total = totals[column.key as keyof InventoryData['totals']];
      if (column.key === 'itemCount') return String(total);
      if (column.key === 'value') return formatMoney(total);
      return formatQuantity(total);
    },
    [totalKeys]
  );

  const fileStem = useMemo(
    () => `Inventory-Report_${asOf || 'current'}`,
    [asOf]
  );

  const exportExcel = () => {
    if (!data || !hasRows) return;

    // Numbers stay numeric so the sheet can be filtered and re-totalled in Excel
    const sheetRows: (string | number)[][] = [
      [data.company.name || 'Inventory Report'],
      ['INVENTORY REPORT (BY HS CODE)'],
      [periodLabel],
      [],
      COLUMNS.map((column) => column.label),
      ...rows.map((row, index) =>
        COLUMNS.map((column) => {
          if (column.key === 'serial') return index + 1;
          if (column.numeric) return row[column.key] as number;
          return String(row[column.key] ?? '');
        })
      ),
      COLUMNS.map((column) => {
        if (column.key === 'description') return 'GRAND TOTAL';
        if (column.numeric && totalKeys.includes(column.key)) {
          return data.totals[column.key as keyof InventoryData['totals']];
        }
        return '';
      })
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet['!cols'] = COLUMNS.map((column) => ({ wch: column.excelWidth }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Report');
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
      doc.text(data.company.name || 'Inventory Report', marginX, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('INVENTORY REPORT (BY HS CODE)', marginX, 17);
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
        Inventory Report
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Stock on hand grouped by HS Code. Click an HS Code to see the individual
        items under it. Balance is opening stock plus purchases received less
        quantities invoiced, the same figure the Items page shows.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            label="As of"
            type="date"
            size="small"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank for current stock"
          />
          <Button variant="contained" onClick={fetchReport} disabled={loading}>
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
            <Inventory2Icon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No items found for this company.
            </Typography>
          </Box>
        )}

        {!loading && hasRows && data && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{data.company.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                INVENTORY REPORT (BY HS CODE)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {periodLabel}
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 620 }}>
              <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48, backgroundColor: '#e2f0d9' }} />
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
                  {rows.map((row, index) => {
                    const isOpen = expandedCodes.has(row.hsCode);

                    return (
                      <React.Fragment key={row.hsCode}>
                        <TableRow
                          hover
                          onClick={() => toggleGroup(row.hsCode)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ width: 48 }}>
                            <IconButton
                              size="small"
                              aria-expanded={isOpen}
                              aria-label={`${isOpen ? 'Collapse' : 'Expand'} HS Code ${row.hsCode}`}
                              onClick={(event) => {
                                // The row toggles as well; let it do that once
                                event.stopPropagation();
                                toggleGroup(row.hsCode);
                              }}
                            >
                              {isOpen ? (
                                <KeyboardArrowDownIcon fontSize="small" />
                              ) : (
                                <KeyboardArrowRightIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          {COLUMNS.map((column) => (
                            <TableCell
                              key={column.key}
                              align={column.align}
                              sx={{
                                whiteSpace: column.align === 'left' ? 'normal' : 'nowrap',
                                fontVariantNumeric: column.numeric ? 'tabular-nums' : undefined,
                                fontWeight: column.key === 'hsCode' ? 600 : undefined,
                                // Negative balance means the item has been oversold
                                color:
                                  column.key === 'balance' && row.balance < 0
                                    ? 'error.main'
                                    : undefined
                              }}
                            >
                              {cellText(row, column, index + 1)}
                            </TableCell>
                          ))}
                        </TableRow>

                        <TableRow>
                          <TableCell
                            colSpan={COLUMNS.length + 1}
                            sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}
                          >
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                              <Box sx={{ my: 1.5, ml: 6 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mb: 0.5 }}
                                >
                                  {row.itemCount} item{row.itemCount === 1 ? '' : 's'} under HS Code{' '}
                                  {row.hsCode}
                                </Typography>
                                <Table size="small" sx={{ backgroundColor: 'grey.50' }}>
                                  <TableHead>
                                    <TableRow>
                                      {ITEM_COLUMNS.map((column) => (
                                        <TableCell
                                          key={column.key}
                                          align={column.align}
                                          sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                        >
                                          {column.label}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {row.items.map((item) => (
                                      <TableRow key={item.itemId} hover>
                                        {ITEM_COLUMNS.map((column) => (
                                          <TableCell
                                            key={column.key}
                                            align={column.align}
                                            sx={{
                                              whiteSpace:
                                                column.align === 'left' ? 'normal' : 'nowrap',
                                              fontVariantNumeric: column.numeric
                                                ? 'tabular-nums'
                                                : undefined,
                                              color:
                                                column.key === 'balance' && item.balance < 0
                                                  ? 'error.main'
                                                  : undefined
                                            }}
                                          >
                                            {itemCellText(item, column)}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}

                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#f0f0f0' }} />
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
              {rows.length} HS Code{rows.length === 1 ? '' : 's'}, {data.totals.itemCount} item
              {data.totals.itemCount === 1 ? '' : 's'}
              {unitsAgree
                ? ''
                : '. Quantity totals are omitted because the units differ between groups.'}
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

export default InventoryReport;
