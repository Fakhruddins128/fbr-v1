import {
  mergeProductDescription,
  normaliseSubDescription,
  isMergedDescriptionTooLong,
  MAX_PRODUCT_DESCRIPTION_LENGTH
} from './invoiceDescription';

const PRODUCT = 'Ink Roll';

describe('mergeProductDescription', () => {
  // The truth table from specs/001-invoice-sub-description/data-model.md
  const cases: Array<[string, string | null | undefined, string]> = [
    ['populated', 'Size 30mm', 'Ink Roll - Size 30mm'],
    ['surrounding whitespace trimmed', '  Size 30mm  ', 'Ink Roll - Size 30mm'],
    ['empty string', '', 'Ink Roll'],
    ['whitespace only', '   ', 'Ink Roll'],
    ['tabs and newlines only', '\t\n ', 'Ink Roll'],
    ['null', null, 'Ink Roll'],
    ['undefined', undefined, 'Ink Roll'],
    ['separator inside the value', 'Size 30mm - Blue', 'Ink Roll - Size 30mm - Blue']
  ];

  it.each(cases)('%s', (_label, sub, expected) => {
    expect(mergeProductDescription(PRODUCT, sub)).toBe(expected);
  });

  it('never leaves a trailing separator when there is no variation', () => {
    for (const blank of ['', '   ', null, undefined]) {
      expect(mergeProductDescription(PRODUCT, blank)).not.toMatch(/-\s*$/);
    }
  });

  it('tolerates a missing product name', () => {
    expect(mergeProductDescription(null, 'Size 30mm')).toBe(' - Size 30mm');
    expect(mergeProductDescription(undefined, undefined)).toBe('');
  });

  it('does not mutate or re-encode the product name', () => {
    expect(mergeProductDescription('82-a-Tools, Spoons & Forks', 'M8')).toBe(
      '82-a-Tools, Spoons & Forks - M8'
    );
  });
});

describe('normaliseSubDescription', () => {
  it('collapses every empty representation to null', () => {
    expect(normaliseSubDescription('')).toBeNull();
    expect(normaliseSubDescription('   ')).toBeNull();
    expect(normaliseSubDescription('\t')).toBeNull();
    expect(normaliseSubDescription(null)).toBeNull();
    expect(normaliseSubDescription(undefined)).toBeNull();
  });

  it('trims a populated value', () => {
    expect(normaliseSubDescription('  Size 30mm  ')).toBe('Size 30mm');
  });
});

describe('isMergedDescriptionTooLong', () => {
  const room = MAX_PRODUCT_DESCRIPTION_LENGTH - PRODUCT.length - ' - '.length;

  it('accepts a merged value of exactly the maximum length', () => {
    const sub = 'x'.repeat(room);
    expect(mergeProductDescription(PRODUCT, sub)).toHaveLength(
      MAX_PRODUCT_DESCRIPTION_LENGTH
    );
    expect(isMergedDescriptionTooLong(PRODUCT, sub)).toBe(false);
  });

  it('rejects one character past the maximum', () => {
    const sub = 'x'.repeat(room + 1);
    expect(mergeProductDescription(PRODUCT, sub)).toHaveLength(
      MAX_PRODUCT_DESCRIPTION_LENGTH + 1
    );
    expect(isMergedDescriptionTooLong(PRODUCT, sub)).toBe(true);
  });

  it('measures the merged value, not the sub-description alone', () => {
    const longName = 'y'.repeat(MAX_PRODUCT_DESCRIPTION_LENGTH);
    expect(isMergedDescriptionTooLong(longName, 'a')).toBe(true);
  });

  it('ignores whitespace that would be trimmed away', () => {
    const sub = `${'x'.repeat(room)}      `;
    expect(isMergedDescriptionTooLong(PRODUCT, sub)).toBe(false);
  });
});
