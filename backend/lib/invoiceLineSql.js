/**
 * What an invoice line is actually worth, as SQL fragments.
 *
 * Invoices.TotalAmount cannot be used for this. It is written as the sum of the
 * line field "Total Value of Sales (in case of FPAD only)", which the user types
 * by hand and leaves at 0 on every invoice that is not FPAD -- so SUM(TotalAmount)
 * reads as zero or near-zero for most companies. The Invoices page has always
 * worked around this by rebuilding the figure from the lines on the client; these
 * expressions are the same rebuild in SQL, so every dashboard and report agrees
 * with the invoice list and with the printed sheet.
 *
 * Lives in its own module so the generated SQL can be inspected and tested
 * without starting the server or opening a database connection.
 */

/**
 * @param {Set<string>} columns InvoiceItems column names that actually exist,
 *   probed from sys.columns, because AdvanceTaxValue, Discount and IsMrpMode
 *   each arrived in a later migration a given database may not have run.
 * @param {string} alias table alias to read the line from. Supplied by calling
 *   code, never by a request.
 */
const invoiceLineSql = (columns, alias = "ii") => {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(alias)) {
    throw new Error(`Unsafe SQL alias: ${alias}`);
  }

  const has = (name) => (columns instanceof Set ? columns.has(name) : false);
  const optional = (name) => (has(name) ? `ISNULL(${alias}.${name}, 0)` : "0");

  // FPAD invoices carry the figure in TotalValues; ordinary ones leave it at 0
  // and the exclusive value is the real one. FixedNotifiedValueOrRetailPrice is
  // the last resort, for a retail-price-only line.
  const exclusive =
    `CASE` +
    ` WHEN ISNULL(${alias}.TotalValues, 0) <> 0 THEN ${alias}.TotalValues` +
    ` WHEN ISNULL(${alias}.ValueSalesExcludingST, 0) <> 0 THEN ${alias}.ValueSalesExcludingST` +
    ` ELSE ISNULL(${alias}.FixedNotifiedValueOrRetailPrice, 0)` +
    ` END`;

  // An MRP line's discount is already inside ValueSalesExcludingST, so taking it
  // off again would remove it twice. Same rule as the printed templates.
  const deductibleDiscount = !has("Discount")
    ? "0"
    : has("IsMrpMode")
      ? `CASE WHEN ISNULL(${alias}.IsMrpMode, 0) = 1 THEN 0 ELSE ISNULL(${alias}.Discount, 0) END`
      : `ISNULL(${alias}.Discount, 0)`;

  // Everything the buyer pays on this line, matching NET TOTAL on the printed
  // invoice: exclusive value plus sales, further, extra and advance tax.
  const net =
    `((${exclusive})` +
    ` + ISNULL(${alias}.SalesTaxApplicable, 0)` +
    ` + ISNULL(${alias}.FurtherTax, 0)` +
    ` + ISNULL(${alias}.ExtraTax, 0)` +
    ` + ${optional("AdvanceTaxValue")}` +
    ` - ${deductibleDiscount})`;

  return {
    /** Sale value before any tax. */
    exclusive: `(${exclusive})`,
    /** Full amount payable on the line. */
    net,
    salesTax: `ISNULL(${alias}.SalesTaxApplicable, 0)`,
    advanceTax: optional("AdvanceTaxValue")
  };
};

/** Column names this module treats as optional. */
const OPTIONAL_INVOICE_ITEM_COLUMNS = [
  "AdvanceTaxValue",
  "Discount",
  "IsMrpMode"
];

/**
 * Probes which of the optional InvoiceItems columns exist, so a database that
 * has not run the later migrations still reports real figures rather than
 * failing on an unknown column.
 */
const probeInvoiceItemColumns = async (pool) => {
  const list = OPTIONAL_INVOICE_ITEM_COLUMNS.map((n) => `'${n}'`).join(", ");
  const result = await pool.request().query(`
    SELECT name
    FROM sys.columns
    WHERE object_id = OBJECT_ID('InvoiceItems')
      AND name IN (${list})
  `);

  return new Set(result.recordset.map((r) => r.name));
};

module.exports = {
  invoiceLineSql,
  probeInvoiceItemColumns,
  OPTIONAL_INVOICE_ITEM_COLUMNS
};
