import fs from 'fs';
import path from 'path';

/**
 * Guards the invariant this whole feature is designed around.
 *
 * Stock is derived, not stored. It is recomputed on every read by matching
 * invoice lines back to catalogue products on HS Code AND product name, in four
 * places:
 *
 *   backend/server.js  /api/items current stock
 *   backend/server.js  Inventory Report
 *   backend/server.js  /api/dashboard/stats
 *   src/pages/SalesInvoice.tsx  getAvailableStock
 *
 * So InvoiceItems.ProductDescription must keep holding the catalogue product
 * name alone. If the merged "Ink Roll - Size 30mm" is ever written there, all
 * four stop matching and sold quantities silently stop counting — no error,
 * just overstated stock.
 *
 * The merge belongs at display and submission time only. These tests read the
 * source rather than exercise behaviour, because the risky call sites sit
 * inside large components that cannot be rendered in isolation. A source-level
 * assertion is a blunt instrument, but it fails loudly the moment someone moves
 * the merge into the save path, which is exactly the regression worth catching.
 */

const read = (relative: string) =>
  fs.readFileSync(path.join(__dirname, '..', '..', relative), 'utf8');

/** Collapse whitespace so indentation changes do not break the assertions. */
const flatten = (source: string) => source.replace(/\s+/g, ' ');

describe('stock invariant: ProductDescription holds the catalogue name alone', () => {
  it('the save payload sends productDescription unmerged', () => {
    const source = flatten(read('src/pages/SalesInvoice.tsx'));

    // The save payload is the mapping that also carries masterItemId.
    const savePayload = source.match(
      /masterItemId: item\.masterItemId, hsCode: [^}]*?rate: item\.rate/
    );
    expect(savePayload).not.toBeNull();
    expect(savePayload![0]).toContain('productDescription: item.productDescription');
    expect(savePayload![0]).not.toContain('mergeProductDescription');
  });

  it('the save payload sends the variation in its own field', () => {
    const source = flatten(read('src/pages/SalesInvoice.tsx'));
    expect(source).toContain('subDescription: normaliseSubDescription(item.subDescription)');
  });

  it('the backend binds productDescription straight from the request', () => {
    const source = flatten(read('backend/server.js'));
    const bindings = source.match(
      /\.input\("productDescription", sql\.NVarChar, item\.productDescription\)/g
    );
    // One in the create path, one in the update path
    expect(bindings).toHaveLength(2);
  });

  it('the backend never concatenates a sub-description into productDescription', () => {
    const source = read('backend/server.js');
    expect(source).not.toMatch(/productDescription[^\n]*\+[^\n]*subDescription/i);
    expect(source).not.toMatch(/subDescription[^\n]*\+[^\n]*productDescription/i);
  });

  it('the four stock matchers still compare against the unmerged name', () => {
    const backend = read('backend/server.js');
    const sqlMatchers = backend.match(
      /ii\.ProductDescription = CAST\(it\.Description AS NVARCHAR\(255\)\)|ii\.ProductDescription = CAST\(Items\.Description AS NVARCHAR\(255\)\)/g
    );
    // /api/items, Inventory Report, dashboard stats
    expect(sqlMatchers!.length).toBeGreaterThanOrEqual(3);

    const frontend = flatten(read('src/pages/SalesInvoice.tsx'));
    expect(frontend).toContain(
      'savedItem.productDescription === masterItem.description'
    );
  });
});

describe('FBR scenario detection reads the unmerged product name', () => {
  it('does not merge before substring-matching for scrap or steel', () => {
    const source = flatten(read('src/pages/SalesInvoice.tsx'));

    // A free-text variation containing "scrap" must not be able to change which
    // tax scenario is submitted.
    expect(source).toContain("item.productDescription?.toLowerCase().includes('scrap')");
    expect(source).not.toMatch(
      /mergeProductDescription\([^)]*\)\s*\??\.toLowerCase\(\)\.includes\('scrap'\)/
    );
  });
});
