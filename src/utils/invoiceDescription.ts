/**
 * Invoice line description rules.
 *
 * An invoice line stores the catalogue product name and an optional
 * line-specific variation separately. The merged form is produced here, at the
 * point it is displayed or submitted, and is never stored.
 *
 * That separation is load-bearing: stock is derived by matching invoice lines
 * to catalogue products on HS Code and product name, so a stored merged value
 * would silently stop sold quantities from being counted.
 */

/** Sits between the product name and its variation. Not reserved or escaped. */
const SEPARATOR = ' - ';

/**
 * Longest product description accepted downstream.
 *
 * InvoiceItems.ProductDescription is NVARCHAR(255). FBR's own limit for the
 * field is not documented in this repository, so 255 is used as a conservative
 * assumption. If FBR publishes a different figure, change it here only.
 */
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 255;

const hasContent = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * The description shown to a user and sent to FBR for one invoice line.
 *
 * Returns the product name alone when the sub-description is absent, empty or
 * only whitespace, so no stray separator is ever rendered.
 */
export const mergeProductDescription = (
  productName: string | null | undefined,
  subDescription?: string | null
): string => {
  const name = productName ?? '';
  return hasContent(subDescription) ? `${name}${SEPARATOR}${subDescription.trim()}` : name;
};

/**
 * What to persist for a line's sub-description.
 *
 * Empty and whitespace-only both collapse to null so storage carries one
 * representation of "no variation" rather than three.
 */
export const normaliseSubDescription = (
  subDescription?: string | null
): string | null => (hasContent(subDescription) ? subDescription.trim() : null);

/**
 * True when the merged description would exceed what storage and FBR accept.
 *
 * The caller warns and blocks submission; it must never truncate, because a
 * shortened description would reach FBR differently from what the user approved.
 */
export const isMergedDescriptionTooLong = (
  productName: string | null | undefined,
  subDescription?: string | null
): boolean =>
  mergeProductDescription(productName, subDescription).length >
  MAX_PRODUCT_DESCRIPTION_LENGTH;
