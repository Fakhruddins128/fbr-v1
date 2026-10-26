# Feature Specification: Optional Product Sub-Description on Sales Invoice Lines

**Feature Branch**: `001-invoice-sub-description`
**Created**: 2026-10-26
**Status**: Draft
**Input**: User description: "Enhance the existing Sales Invoice module with an optional Product Sub-Description per invoice line, so products with the same HS Code and Product Name can have different specifications without creating duplicate Item Master records."

## Overview

Some goods share one HS Code and one product name but differ by size, colour, or specification. Today the only way to record that difference on an invoice is to create a separate Item Master record for each variation, which inflates the product catalogue, splits the stock position for what is really one product, and makes the item list harder to maintain.

This feature lets a user type the variation directly on the invoice line. The product catalogue keeps one record; the invoice line carries the detail.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a variation on an invoice line (Priority: P1)

A sales user raising an invoice picks a product from the catalogue as they do today. The product name fills in automatically. They then type the specific variation for this line — for example "Size 30mm" — into an optional sub-description box. The invoice shows the product as "Ink Roll - Size 30mm", while the catalogue still holds a single "Ink Roll" product.

**Why this priority**: This is the whole feature. Without it the user still has to create duplicate catalogue entries, which is the problem being solved. Delivers value on its own even if nothing else ships.

**Independent Test**: Raise an invoice, select a product, type a sub-description, and confirm the line reads "Product - Variation" on screen while the Items page still shows one product.

**Acceptance Scenarios**:

1. **Given** a product "Ink Roll" exists under HS Code 1111.2222, **When** the user selects it on an invoice line, **Then** the product name fills in automatically and the sub-description box is empty.
2. **Given** a line with product "Ink Roll", **When** the user types "Size 30mm" into the sub-description, **Then** the line's description reads "Ink Roll - Size 30mm".
3. **Given** a line with product "Ink Roll", **When** the sub-description is left empty, **Then** the line's description reads "Ink Roll" with no trailing separator.
4. **Given** a line with product "Ink Roll", **When** the user types only spaces into the sub-description, **Then** the line's description reads "Ink Roll" with no trailing separator.
5. **Given** an invoice with three lines all using "Ink Roll", **When** the user types a different sub-description on each, **Then** each line keeps its own value and editing one line does not change another.

---

### User Story 2 - The variation survives saving and reopening (Priority: P1)

A user saves an invoice containing sub-descriptions, closes it, and reopens it later to review or amend. Every line comes back with the variation they typed.

**Why this priority**: A variation that is lost on save is worse than no feature at all, because the user believes the detail was recorded. P1 alongside Story 1 — the two together are the minimum that can be released.

**Independent Test**: Save an invoice with sub-descriptions on some lines and not others, reopen it, and confirm each line matches what was entered.

**Acceptance Scenarios**:

1. **Given** an invoice saved with sub-descriptions on some lines, **When** the user reopens it, **Then** each line shows the sub-description it was saved with and lines saved without one show an empty box.
2. **Given** a saved invoice, **When** the user changes a line's sub-description and saves again, **Then** reopening shows the updated value.
3. **Given** a saved invoice, **When** the user clears a line's sub-description and saves, **Then** reopening shows an empty box and the line reads as the product name alone.
4. **Given** an invoice created before this feature existed, **When** the user opens it, **Then** it opens without error and every line reads as its product name alone.

---

### User Story 3 - The variation appears everywhere the invoice does (Priority: P2)

A user previews, prints, or exports an invoice to PDF, and sends it to FBR. The merged description appears identically in all of them, so the customer document, the stored record, and the tax filing agree.

**Why this priority**: Depends on Stories 1 and 2 existing first. Separated because the capture and storage can be verified before the output paths are updated, but the feature is not complete for a customer until every document agrees.

**Independent Test**: Take one saved invoice with sub-descriptions and compare the description on the preview, the printed output, the PDF, and the FBR submission payload.

**Acceptance Scenarios**:

1. **Given** a line with a sub-description, **When** the user previews the invoice, **Then** the merged description appears.
2. **Given** the same invoice, **When** the user prints it or exports a PDF, **Then** the merged description appears identically.
3. **Given** the same invoice, **When** it is submitted to FBR, **Then** the product description sent is the merged value and the HS Code is unchanged.
4. **Given** a line without a sub-description, **When** the invoice is submitted to FBR, **Then** the product description sent is the product name alone.

---

### Edge Cases

- **Whitespace-only input**: treated as empty everywhere — no separator is added, and the stored value is indistinguishable from never having been filled in.
- **Separator inside the sub-description**: a user types "Size 30mm - Blue". The merged result is "Ink Roll - Size 30mm - Blue". The separator is not reserved and needs no escaping.
- **Combined length**: a long product name plus a long sub-description can exceed the length the invoice record and FBR accept for a description. The system must not silently truncate a description in a way that reaches FBR differently from what the user saw and approved.
- **Same product, different variations, one invoice**: lines are independent; reordering, inserting, or deleting a line must not move a sub-description onto a different line.
- **Historic invoices**: records created before this feature have no sub-description; they must display, print, and re-submit exactly as they do today.
- **Stock position**: a product sold with three different sub-descriptions is still one product. Its stock, and anything derived from stock, must continue to count all three lines against the single catalogue record.

## Requirements *(mandatory)*

### Functional Requirements

**Capture**

- **FR-001**: Each sales invoice line MUST offer an optional sub-description that the user can type freely.
- **FR-002**: The sub-description MUST default to empty on a new line and MUST NOT be required to save an invoice.
- **FR-003**: Each invoice line MUST hold its own sub-description independently, including when several lines use the same product.
- **FR-004**: Selecting a product MUST continue to fill the product name exactly as it does today, and MUST NOT alter the catalogue record.
- **FR-005**: Where an HS Code maps to more than one product, the existing product selection behaviour MUST be preserved; this feature MUST NOT introduce a new way of choosing between them.

**Merging**

- **FR-006**: When a sub-description has content, the description presented for a line MUST be the product name, a space-hyphen-space separator, then the sub-description — for example "Ink Roll - Size 30mm".
- **FR-007**: When a sub-description is empty or contains only whitespace, the description presented MUST be the product name alone, with no separator.
- **FR-008**: Leading and trailing whitespace in the sub-description MUST be ignored when merging.
- **FR-009**: The same merging rule MUST be applied in every place an invoice line description is shown or sent: on-screen entry, preview, print, PDF, and the FBR submission.

**Storage**

- **FR-010**: The product name and the sub-description MUST be stored as separate values on the invoice line. The merged description MUST be produced at the point of display or submission, and MUST NOT be written into the stored product name.
- **FR-011**: The stored product name on an invoice line MUST continue to hold the catalogue product name alone, because stock and inventory figures are derived by matching invoice lines to catalogue products on HS Code and product name. Writing a merged value there would stop sold quantities from being counted and would overstate stock.
- **FR-012**: Invoice records created before this feature MUST remain readable and editable, with an absent sub-description behaving identically to an empty one.
- **FR-013**: Saving, reopening, amending, and re-saving an invoice MUST preserve each line's sub-description.

**Tax submission**

- **FR-014**: The HS Code and every other value sent to FBR MUST be unchanged by this feature.
- **FR-015**: Tax rates, line values, and invoice totals MUST NOT be affected by the presence or content of a sub-description.
- **FR-016**: Existing FBR validation rules and field-length limits MUST continue to be enforced against the merged description.
- **FR-017**: If a merged description would exceed the length the invoice record or FBR accepts, the user MUST be told before the invoice is submitted, rather than the value being silently shortened.

**Catalogue integrity**

- **FR-018**: Using a sub-description MUST NOT create, rename, or otherwise modify any Item Master product.
- **FR-019**: Stock, inventory reporting, and any other figure derived from invoice lines MUST continue to attribute all lines for a product to that single catalogue record, regardless of sub-descriptions used.

### Key Entities

- **Item Master product**: the catalogue record. Carries the HS Code, the product name, unit, price, and tax rates. Unchanged by this feature, and deliberately so — the point is to stop variations from multiplying these.
- **Sales invoice line**: one line of an invoice. Already references a product and carries quantity, values, and taxes. Gains one optional free-text sub-description that belongs to that line alone.
- **Merged description**: not stored. Derived from the product name and the sub-description whenever a line is shown or submitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can record a product variation on an invoice line without leaving the invoice screen and without creating a catalogue record.
- **SC-002**: The number of catalogue products that exist only to express a size, colour, or specification variation falls to zero for products created after release.
- **SC-003**: For any invoice line, the description shown on screen, on the printed invoice, on the PDF, and in the tax submission is identical in 100% of cases.
- **SC-004**: Every invoice created before the release opens, prints, and re-submits with no change in output and no errors.
- **SC-005**: A product sold across multiple lines with different variations reports one stock position, and that position matches the figure the same sales would have produced before the release.
- **SC-006**: No invoice is submitted to the tax authority carrying a description the user did not see and approve.

## Assumptions

- The separator between product name and sub-description is " - " (space, hyphen, space), as given in the source requirement. It is not configurable.
- The sub-description is free text entered by the user. There is no predefined list of variations, and no validation beyond the existing restrictions the application applies to text entry.
- The sub-description is for display and tax submission only. It is not a reporting dimension: stock, registers, and inventory reports continue to group by product, not by variation.
- An empty sub-description and an absent one are equivalent throughout, so historic records need no backfill.
- Purchases are out of scope. This feature applies to sales invoice lines only.
- The feature is available to every user who can already raise or amend a sales invoice; it introduces no new permission.

## Dependencies

- The existing product lookup on the sales invoice, which fills the product name from the chosen catalogue record.
- The existing invoice save, reopen, and amend flow.
- The existing invoice preview, print, and PDF output.
- The existing FBR submission, including its validation and field-length rules.
- The existing stock derivation, which matches invoice lines to catalogue products by HS Code and product name. FR-011 exists to protect this.

## Out of Scope

- Changing how a product is chosen when one HS Code maps to several products.
- Any variation support on purchases, the item catalogue, or stock tracking per variation.
- Reporting, filtering, or searching by sub-description.
- Backfilling or migrating historic invoice records.
- Any change to tax rates, calculations, totals, or other FBR fields.
