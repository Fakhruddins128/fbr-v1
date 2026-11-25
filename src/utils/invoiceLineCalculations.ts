/**
 * Sales invoice line pricing, for both Item Detail modes.
 *
 * MRP mode (toggle ON) prices downwards from retail price:
 *     MRP Value        = MRP per Item x Quantity
 *     Total Excl. ST   = MRP Value - Discount Value
 *     Sale Price/Prod  = Total Excl. ST / Quantity      (derived)
 *
 * Normal mode (toggle OFF) prices upwards from unit price:
 *     Total Excl. ST   = Sale Price per Product x Quantity
 *
 * Taxes then follow from Total Excl. ST in both modes, with one deliberate
 * exception recorded in ADVANCE_TAX_BASE below.
 */

/** Money is carried to 2 decimals, matching DECIMAL(18,2) in the schema. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Tax percentages are carried to 4 decimals, matching
 * InvoiceItems.AdvanceTaxRate and .FurtherTaxRate. Back-solving a rate from a
 * typed amount rarely lands on a round number, and 2 decimals would lose enough
 * to shift the amount back by a rupee or more on a large line.
 */
const round4 = (value: number): number => Math.round(value * 10000) / 10000;

/**
 * Back-solves a tax percentage from an amount the user typed directly.
 *
 * Returns 0 when there is nothing to charge tax on — a line with no quantity or
 * price yet — because no percentage of zero produces a non-zero amount. The
 * caller is responsible for telling the user that the amount they typed cannot
 * be expressed as a rate until the line has a sale value.
 */
export const rateFromValue = (value: number, base: number): number => {
  const amount = Number(value) || 0;
  const divisor = Number(base) || 0;

  if (divisor <= 0) {
    return 0;
  }

  return round4((amount * 100) / divisor);
};

/**
 * Sales tax is held as a string such as "18%" because that is the form FBR
 * requires and the item master supplies. Non-numeric values ("Select", "")
 * read as zero rather than throwing.
 */
export const parseTaxRate = (rate: string | null | undefined): number => {
  if (typeof rate !== 'string') return 0;
  const match = rate.trim().match(/^(\d+(?:\.\d+)?)\s*%?$/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Which amount Advance Tax is charged on.
 *
 * MRP mode uses the tax-exclusive total, per the 2026-11-18 requirement.
 * Normal mode keeps the tax-inclusive base the system has always used, so
 * existing invoicing is unaffected. This split was an explicit decision; see
 * docs/SALES_INVOICE_MRP_MODE.md section 5.1.
 */
const ADVANCE_TAX_BASE = {
  mrpMode: 'exclusive',
  normalMode: 'inclusive'
} as const;

export interface InvoiceLineInputs {
  isMrpMode: boolean;
  quantity: number;
  /** MRP mode only: retail price of one unit. */
  mrpPerItem: number;
  /** MRP mode only: amount taken off the retail total. */
  discountValue: number;
  /** Normal mode only: the unit price the user types. */
  salePricePerProduct: number;
  /** Sales tax percentage, as the string the rest of the app uses. */
  rate: string;
  advanceTaxRate: number;
  furtherTaxRate: number;
}

export interface InvoiceLineTotals {
  mrpValue: number;
  valueSalesExclST: number;
  salePricePerProduct: number;
  salesTax: number;
  advanceTaxValue: number;
  furtherTax: number;
  /**
   * The amounts the two percentage-driven taxes are charged on. Returned so
   * that a caller back-solving a rate from a typed amount divides by exactly
   * the figure this module multiplied by, including the mode split above.
   */
  advanceTaxBase: number;
  furtherTaxBase: number;
}

export const calculateInvoiceLine = (inputs: InvoiceLineInputs): InvoiceLineTotals => {
  const quantity = Number(inputs.quantity) || 0;
  const mrpValue = inputs.isMrpMode ? round2((Number(inputs.mrpPerItem) || 0) * quantity) : 0;

  const valueSalesExclST = inputs.isMrpMode
    ? round2(mrpValue - (Number(inputs.discountValue) || 0))
    : round2((Number(inputs.salePricePerProduct) || 0) * quantity);

  // A new line starts at quantity 0, so this division must not produce
  // Infinity or NaN and leak into the form or the FBR payload.
  const salePricePerProduct = inputs.isMrpMode
    ? quantity > 0
      ? round2(valueSalesExclST / quantity)
      : 0
    : Number(inputs.salePricePerProduct) || 0;

  const salesTax = round2((valueSalesExclST * parseTaxRate(inputs.rate)) / 100);

  const advanceTaxBase =
    (inputs.isMrpMode ? ADVANCE_TAX_BASE.mrpMode : ADVANCE_TAX_BASE.normalMode) === 'exclusive'
      ? valueSalesExclST
      : valueSalesExclST + salesTax;

  const advanceTaxValue = round2(
    (advanceTaxBase * (Number(inputs.advanceTaxRate) || 0)) / 100
  );

  const furtherTax = round2(
    (valueSalesExclST * (Number(inputs.furtherTaxRate) || 0)) / 100
  );

  return {
    mrpValue,
    valueSalesExclST,
    salePricePerProduct,
    salesTax,
    advanceTaxValue,
    furtherTax,
    advanceTaxBase,
    furtherTaxBase: valueSalesExclST
  };
};
