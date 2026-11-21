import {
  calculateInvoiceLine,
  parseTaxRate,
  InvoiceLineInputs
} from './invoiceLineCalculations';

const line = (overrides: Partial<InvoiceLineInputs> = {}): InvoiceLineInputs => ({
  isMrpMode: false,
  quantity: 0,
  mrpPerItem: 0,
  discountValue: 0,
  salePricePerProduct: 0,
  rate: '18%',
  advanceTaxRate: 0,
  furtherTaxRate: 0,
  ...overrides
});

describe('parseTaxRate', () => {
  it.each([
    ['18%', 18],
    ['18', 18],
    ['17.5%', 17.5],
    [' 18 % ', 18],
    ['Select', 0],
    ['', 0],
    [null, 0],
    [undefined, 0]
  ])('%s -> %s', (input, expected) => {
    expect(parseTaxRate(input as string)).toBe(expected);
  });
});

describe('MRP mode', () => {
  it('matches the worked example from the requirement', () => {
    // MRP 1,500 x 10 = 15,000, less 3,000 discount = 12,000 excl. ST
    const totals = calculateInvoiceLine(
      line({ isMrpMode: true, quantity: 10, mrpPerItem: 1500, discountValue: 3000 })
    );

    expect(totals.mrpValue).toBe(15000);
    expect(totals.valueSalesExclST).toBe(12000);
    expect(totals.salePricePerProduct).toBe(1200);
  });

  it('derives sales tax from the discounted total, not the retail total', () => {
    const totals = calculateInvoiceLine(
      line({ isMrpMode: true, quantity: 10, mrpPerItem: 1500, discountValue: 3000 })
    );
    expect(totals.salesTax).toBe(2160); // 12,000 x 18%
  });

  it('charges advance tax on the tax-exclusive total', () => {
    const totals = calculateInvoiceLine(
      line({
        isMrpMode: true,
        quantity: 10,
        mrpPerItem: 1500,
        discountValue: 3000,
        advanceTaxRate: 0.5
      })
    );
    expect(totals.advanceTaxValue).toBe(60); // 12,000 x 0.5%, NOT 14,160
  });

  it('derives further tax from the exclusive total', () => {
    const totals = calculateInvoiceLine(
      line({ isMrpMode: true, quantity: 10, mrpPerItem: 1500, discountValue: 3000, furtherTaxRate: 3 })
    );
    expect(totals.furtherTax).toBe(360); // 12,000 x 3%
  });

  it('does not divide by zero on a brand new line', () => {
    const totals = calculateInvoiceLine(line({ isMrpMode: true, quantity: 0, mrpPerItem: 1500 }));
    expect(totals.salePricePerProduct).toBe(0);
    expect(Number.isFinite(totals.salePricePerProduct)).toBe(true);
    expect(Number.isNaN(totals.salePricePerProduct)).toBe(false);
  });

  it('allows a discount larger than the retail total to go negative', () => {
    // Not blocked here; the form surfaces it. Recorded so the behaviour is deliberate.
    const totals = calculateInvoiceLine(
      line({ isMrpMode: true, quantity: 1, mrpPerItem: 100, discountValue: 250 })
    );
    expect(totals.valueSalesExclST).toBe(-150);
  });

  it('rounds to two decimals', () => {
    const totals = calculateInvoiceLine(
      line({ isMrpMode: true, quantity: 3, mrpPerItem: 33.333, rate: '18%' })
    );
    expect(totals.mrpValue).toBe(100);
    expect(totals.salesTax).toBe(18);
  });
});

describe('normal mode', () => {
  it('totals from unit price and quantity', () => {
    const totals = calculateInvoiceLine(
      line({ quantity: 10, salePricePerProduct: 1200 })
    );
    expect(totals.valueSalesExclST).toBe(12000);
    expect(totals.salePricePerProduct).toBe(1200);
  });

  it('keeps the MRP value at zero', () => {
    const totals = calculateInvoiceLine(line({ quantity: 10, salePricePerProduct: 1200, mrpPerItem: 999 }));
    expect(totals.mrpValue).toBe(0);
  });

  it('keeps the existing tax-inclusive advance tax base', () => {
    const totals = calculateInvoiceLine(
      line({ quantity: 10, salePricePerProduct: 1200, advanceTaxRate: 0.5 })
    );
    // (12,000 + 2,160) x 0.5% = 70.80 — unchanged from the behaviour before MRP mode
    expect(totals.advanceTaxValue).toBe(70.8);
  });

  it('differs from MRP mode only in the advance tax base', () => {
    const shared = { quantity: 10, advanceTaxRate: 0.5, rate: '18%' };
    const normal = calculateInvoiceLine(line({ ...shared, salePricePerProduct: 1200 }));
    const mrp = calculateInvoiceLine(
      line({ ...shared, isMrpMode: true, mrpPerItem: 1500, discountValue: 3000 })
    );

    expect(mrp.valueSalesExclST).toBe(normal.valueSalesExclST);
    expect(mrp.salesTax).toBe(normal.salesTax);
    expect(mrp.advanceTaxValue).not.toBe(normal.advanceTaxValue);
  });

  it('treats a zero or unset rate as no tax', () => {
    const totals = calculateInvoiceLine(
      line({ quantity: 5, salePricePerProduct: 100, rate: 'Select' })
    );
    expect(totals.salesTax).toBe(0);
    expect(totals.valueSalesExclST).toBe(500);
  });
});
