export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (!isFinite(numericValue)) {
    return '0.00';
  }

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value: string | Date): string => {
  if (!value) {
    return '';
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString();
};

const escapeCSVValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const buildCSVContent = (rows: Array<Array<string | number | boolean | null | undefined>>): string => {
  return rows
    .map((row) => row.map((value) => escapeCSVValue(value)).join(','))
    .join('\n');
};

/**
 * Split CSV text into rows of fields, honouring quoted fields that contain
 * commas, quotes or line breaks. This is the counterpart to buildCSVContent:
 * anything that writer produces, this reader restores unchanged.
 *
 * Splitting on "," instead loses any value with a comma in it, which in this
 * application means the default unit of measure, "Numbers, pieces, units".
 *
 * Blank lines are dropped. Fields are returned verbatim, so callers that want
 * trimmed values should trim them.
 */
export const parseCSV = (text: string): string[][] => {
  // A byte-order mark would otherwise become part of the first header
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char !== '"') {
        field += char;
      } else if (input[i + 1] === '"') {
        // "" inside a quoted field is a literal quote
        field += '"';
        i += 1;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // The last row when the file does not end in a line break
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
};

export const downloadCSVFile = (
  filename: string,
  rows: Array<Array<string | number | boolean | null | undefined>>
): void => {
  const csvContent = buildCSVContent(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
