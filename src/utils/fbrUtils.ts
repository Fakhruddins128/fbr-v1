import { FBRInvoicePayload, FBRInvoiceItem } from '../types';

/**
 * Validates an FBR invoice payload
 * @param invoice - The invoice data to validate
 * @returns Object containing validation result and any errors
 */
export const validateFBRInvoice = (invoice: FBRInvoicePayload): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required fields
  if (!invoice.invoiceType) errors.push('Invoice type is required');
  if (!invoice.invoiceDate) errors.push('Invoice date is required');
  if (!invoice.sellerNTNCNIC) errors.push('Seller NTN/CNIC is required');
  if (!invoice.sellerBusinessName) errors.push('Seller business name is required');
  if (!invoice.sellerProvince) errors.push('Seller province is required');
  if (!invoice.sellerAddress) errors.push('Seller address is required');
  if (!invoice.buyerNTNCNIC) errors.push('Buyer NTN/CNIC is required');
  if (!invoice.buyerBusinessName) errors.push('Buyer business name is required');
  if (!invoice.buyerProvince) errors.push('Buyer province is required');
  if (!invoice.buyerAddress) errors.push('Buyer address is required');
  if (!invoice.buyerRegistrationType) errors.push('Buyer registration type is required');
  if (!invoice.scenarioId) errors.push('Scenario ID is required');
  
  // Validate NTN/CNIC format
  if (invoice.sellerNTNCNIC && !isValidNTNCNIC(invoice.sellerNTNCNIC)) {
    errors.push('Seller NTN/CNIC must be 7 or 13 digits');
  }
  
  if (invoice.buyerNTNCNIC && !isValidNTNCNIC(invoice.buyerNTNCNIC)) {
    errors.push('Buyer NTN/CNIC must be 7 or 13 digits');
  }
  
  // Validate items
  if (!invoice.items || invoice.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    // Validate each item
    invoice.items.forEach((item, index) => {
      const itemErrors = validateFBRInvoiceItem(item);
      if (itemErrors.length > 0) {
        errors.push(`Item #${index + 1}: ${itemErrors.join(', ')}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates an FBR invoice item
 * @param item - The invoice item to validate
 * @returns Array of validation errors
 */
export const validateFBRInvoiceItem = (item: FBRInvoiceItem): string[] => {
  const errors: string[] = [];
  
  if (!item.hsCode) errors.push('HS Code is required');
  if (!item.productDescription) errors.push('Product description is required');
  if (!item.rate) errors.push('Rate is required');
  if (!item.uoM) errors.push('Unit of Measure is required');
  if (item.quantity <= 0) errors.push('Quantity must be greater than 0');
  if (item.valueSalesExcludingST < 0) errors.push('Value excluding sales tax cannot be negative');
  
  return errors;
};

/**
 * Validates if a string is a valid NTN (7 digits) or CNIC (13 digits)
 * @param value - The NTN/CNIC value to validate
 * @returns Boolean indicating if the value is valid
 */
export const isValidNTNCNIC = (value: string): boolean => {
  // Remove any non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Check if it's 7 digits (NTN) or 13 digits (CNIC)
  return digitsOnly.length === 7 || digitsOnly.length === 13;
};

/**
 * Formats a date to the FBR required format (YYYY-MM-DD)
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatFBRDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates the total amount for an invoice
 * @param items - The invoice items
 * @returns The total invoice amount
 */
export const calculateInvoiceTotal = (items: FBRInvoiceItem[]): number => {
  return items.reduce((total, item) => {
    const itemTotal = item.valueSalesExcludingST + 
                      item.salesTaxApplicable + 
                      item.extraTax + 
                      item.furtherTax + 
                      item.fedPayable - 
                      item.discount;
    return total + itemTotal;
  }, 0);
};

// Sample invoice function removed - use actual data from forms instead