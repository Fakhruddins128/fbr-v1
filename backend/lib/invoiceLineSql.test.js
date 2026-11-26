/**
 * Tests for the invoice line SQL fragments.
 *
 * Run with:  node backend/lib/invoiceLineSql.test.js
 *
 * A plain node script rather than a jest spec because this project's jest comes
 * from react-scripts, whose `roots` is fixed to src/ and is not an overridable
 * key -- a spec placed here would never be discovered by `npm test`.
 */

const assert = require("assert");
const { invoiceLineSql } = require("./invoiceLineSql");

const ALL = new Set(["AdvanceTaxValue", "Discount", "IsMrpMode"]);
const LEGACY = new Set(["AdvanceTaxValue", "Discount"]);
const BARE = new Set();

let run = 0;
let failed = 0;

const test = (name, fn) => {
  run += 1;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       ${error.message}`);
  }
};

/**
 * Evaluates a fragment against one line, by turning the SQL into JavaScript.
 * Crude, but it exercises the arithmetic and the CASE ordering, which is the
 * part that can be wrong in a way no syntax check would catch.
 */
const caseToTernary = (sql) => {
  // Innermost CASE first: the body may not itself contain CASE or END.
  const innermost = /CASE((?:(?!CASE|END)[\s\S])*)END/;

  while (innermost.test(sql)) {
    sql = sql.replace(innermost, (_, body) => {
      const branches = [];
      const when = /WHEN\s+([\s\S]*?)\s+THEN\s+([\s\S]*?)(?=\s+WHEN\s|\s+ELSE\s|$)/g;
      let match;
      while ((match = when.exec(body)) !== null) {
        branches.push([match[1], match[2]]);
      }

      const otherwise = /\sELSE\s+([\s\S]*)$/.exec(body);
      let out = `(${otherwise ? otherwise[1] : "null"})`;
      for (let i = branches.length - 1; i >= 0; i -= 1) {
        out = `((${branches[i][0]}) ? (${branches[i][1]}) : ${out})`;
      }
      return out;
    });
  }

  return sql;
};

const evaluate = (fragment, line) => {
  const js = caseToTernary(
    fragment
      .replace(/ISNULL\(/g, "nz(")
      .replace(/\bzz\.|\bii\./g, "row.")
      .replace(/<>/g, "!==")
      // SQL equality, left alone where it is already !== from the line above.
      .replace(/([^<>!=])=([^=])/g, "$1===$2")
  );

  const nz = (v) => (v === null || v === undefined ? 0 : v);
  // eslint-disable-next-line no-new-func
  return new Function("row", "nz", `return ${js};`)(line, nz);
};

const line = (overrides = {}) => ({
  TotalValues: 0,
  ValueSalesExcludingST: 0,
  FixedNotifiedValueOrRetailPrice: 0,
  SalesTaxApplicable: 0,
  FurtherTax: 0,
  ExtraTax: 0,
  AdvanceTaxValue: 0,
  Discount: 0,
  IsMrpMode: 0,
  Quantity: 0,
  ...overrides
});

console.log("invoiceLineSql");

test("alias must be an identifier", () => {
  assert.throws(() => invoiceLineSql(ALL, "ii; DROP TABLE Invoices --"));
  assert.throws(() => invoiceLineSql(ALL, "ii ii"));
  assert.doesNotThrow(() => invoiceLineSql(ALL, "ii2"));
});

test("every fragment uses the alias it was given", () => {
  const sql = invoiceLineSql(ALL, "zz");
  for (const fragment of [sql.net, sql.exclusive, sql.salesTax]) {
    assert.ok(fragment.includes("zz."), fragment);
    assert.ok(!/\bii\./.test(fragment), fragment);
  }
});

test("omits a column the database does not have", () => {
  assert.ok(!invoiceLineSql(BARE).net.includes("AdvanceTaxValue"));
  assert.ok(!invoiceLineSql(BARE).net.includes("Discount"));
  assert.ok(!invoiceLineSql(LEGACY).net.includes("IsMrpMode"));
  assert.ok(invoiceLineSql(ALL).net.includes("IsMrpMode"));
});

console.log("exclusive value");

test("prefers TotalValues when the FPAD field was filled in", () => {
  const value = evaluate(
    invoiceLineSql(ALL).exclusive,
    line({ TotalValues: 9000, ValueSalesExcludingST: 12000 })
  );
  assert.strictEqual(value, 9000);
});

test("falls back to the exclusive value on an ordinary invoice", () => {
  const value = evaluate(
    invoiceLineSql(ALL).exclusive,
    line({ ValueSalesExcludingST: 12000 })
  );
  assert.strictEqual(value, 12000);
});

test("falls back to the retail price when nothing else is set", () => {
  const value = evaluate(
    invoiceLineSql(ALL).exclusive,
    line({ FixedNotifiedValueOrRetailPrice: 15000 })
  );
  assert.strictEqual(value, 15000);
});

test("is 0 for an empty line rather than null", () => {
  assert.strictEqual(evaluate(invoiceLineSql(ALL).exclusive, line()), 0);
});

console.log("net payable");

test("adds every tax on the line", () => {
  const value = evaluate(
    invoiceLineSql(ALL).net,
    line({
      ValueSalesExcludingST: 12000,
      SalesTaxApplicable: 2160,
      FurtherTax: 60,
      ExtraTax: 40,
      AdvanceTaxValue: 70.8
    })
  );
  assert.strictEqual(value, 12000 + 2160 + 60 + 40 + 70.8);
});

test("deducts a discount on a normal-mode line", () => {
  const value = evaluate(
    invoiceLineSql(ALL).net,
    line({ ValueSalesExcludingST: 12000, Discount: 500 })
  );
  assert.strictEqual(value, 11500);
});

test("does not deduct an MRP line discount a second time", () => {
  // 1,500 x 10 less a 3,000 discount is already 12,000 in the exclusive value.
  const value = evaluate(
    invoiceLineSql(ALL).net,
    line({ ValueSalesExcludingST: 12000, Discount: 3000, IsMrpMode: 1 })
  );
  assert.strictEqual(value, 12000);
});

test("still deducts the discount where IsMrpMode does not exist yet", () => {
  const value = evaluate(
    invoiceLineSql(LEGACY).net,
    line({ ValueSalesExcludingST: 12000, Discount: 500 })
  );
  assert.strictEqual(value, 11500);
});

test("ignores advance tax and discount entirely on a bare schema", () => {
  const value = evaluate(
    invoiceLineSql(BARE).net,
    line({
      ValueSalesExcludingST: 12000,
      SalesTaxApplicable: 2160,
      AdvanceTaxValue: 70.8,
      Discount: 500
    })
  );
  assert.strictEqual(value, 14160);
});

test("matches the printed invoice NET TOTAL for the worked MRP example", () => {
  // Template 5: 12,000 excl. + 2,160 sales tax + 60 advance tax = 14,220.
  const value = evaluate(
    invoiceLineSql(ALL).net,
    line({
      ValueSalesExcludingST: 12000,
      SalesTaxApplicable: 2160,
      AdvanceTaxValue: 60,
      Discount: 3000,
      IsMrpMode: 1
    })
  );
  assert.strictEqual(value, 14220);
});

console.log(`\n${run - failed}/${run} passed`);
process.exit(failed === 0 ? 0 : 1);
