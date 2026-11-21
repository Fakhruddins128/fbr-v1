import {
  calculateTotals,
  mrpValueOf,
  advanceTaxBaseOf,
  deductibleDiscountOf,
  InvoiceItem
} from './SalesInvoiceReport';

/**
 * The printed sheets compute their own footers from the line data, so these
 * cover the two places where an MRP line behaves differently from a line priced
 * as unit price x quantity: its discount is already inside the exclusive value,
 * and its advance tax is charged on that exclusive value rather than on the
 * tax-inclusive one.
 */

const line = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  hsCode: '0101.2100',
  productDescription: 'Sample Product',
  rate: '18%',
  uoM: 'Numbers, pieces, units',
  quantity: 10,
  valueSalesExcludingST: 12000,
  fixedNotifiedValueOrRetailPrice: 0,
  salesTaxApplicable: 2160,
  salesTaxWithheldAtSource: 0,
  extraTax: 0,
  furtherTax: 0,
  sroScheduleNo: '',
  fedPayable: 0,
  discount: 0,
  totalValues: 14160,
  saleType: 'Goods at standard rate (default)',
  sroItemSerialNo: '',
  ...overrides
});

/** The worked example from the MRP requirement: 1,500 x 10 less 3,000 = 12,000. */
const mrpLine = (overrides: Partial<InvoiceItem> = {}): InvoiceItem =>
  line({
    isMrpMode: true,
    mrpPerItem: 1500,
    fixedNotifiedValueOrRetailPrice: 15000,
    salePricePerProduct: 1200,
    discount: 3000,
    ...overrides
  });

describe('mrpValueOf', () => {
  it('reports the stored gross retail value for an MRP line', () => {
    expect(mrpValueOf(mrpLine())).toBe(15000);
  });

  it('falls back to retail price x quantity when the stored value is missing', () => {
    expect(mrpValueOf(mrpLine({ fixedNotifiedValueOrRetailPrice: 0 }))).toBe(15000);
  });

  it('is zero for a line priced as unit price x quantity', () => {
    expect(mrpValueOf(line({ fixedNotifiedValueOrRetailPrice: 15000 }))).toBe(0);
  });
});

describe('advanceTaxBaseOf', () => {
  it('uses the tax-exclusive total for an MRP line', () => {
    expect(advanceTaxBaseOf(mrpLine())).toBe(12000);
  });

  it('uses the tax-inclusive total otherwise', () => {
    expect(advanceTaxBaseOf(line())).toBe(14160);
  });
});

describe('deductibleDiscountOf', () => {
  it('is zero for an MRP line, whose discount is already inside the exclusive value', () => {
    expect(deductibleDiscountOf(mrpLine())).toBe(0);
  });

  it('is the full discount for a line priced as unit price x quantity', () => {
    expect(deductibleDiscountOf(line({ discount: 500 }))).toBe(500);
  });
});

describe('calculateTotals', () => {
  it('does not deduct an MRP line discount a second time', () => {
    const totals = calculateTotals([mrpLine()]);

    expect(totals.subtotal).toBe(12000);
    expect(totals.totalDiscount).toBe(0);
    expect(totals.grandTotal).toBe(14160);
  });

  it('still reports the discount given, for templates that print it', () => {
    expect(calculateTotals([mrpLine()]).discountGiven).toBe(3000);
  });

  it('deducts a discount that has not been applied to the line value', () => {
    const totals = calculateTotals([line({ discount: 500 })]);

    expect(totals.totalDiscount).toBe(500);
    expect(totals.grandTotal).toBe(13660);
  });

  it('handles an invoice that mixes the two pricing modes', () => {
    const totals = calculateTotals([mrpLine(), line({ discount: 500 })]);

    expect(totals.subtotal).toBe(24000);
    expect(totals.discountGiven).toBe(3500);
    expect(totals.totalDiscount).toBe(500);
    expect(totals.grandTotal).toBe(24000 + 4320 - 500);
  });
});
