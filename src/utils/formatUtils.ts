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
