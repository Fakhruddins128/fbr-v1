---
id: 0001
title: Optional Product Sub-Description Spec
stage: spec
date: 2026-10-26
surface: agent
model: claude-opus-5
feature: 001-invoice-sub-description
branch: 001-invoice-sub-description
user: Fakhruddins128
command: /sp.specify
labels: ["sales-invoice", "fbr", "item-master", "spec"]
links:
  spec: specs/001-invoice-sub-description/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-invoice-sub-description/spec.md
 - specs/001-invoice-sub-description/checklists/requirements.md
tests:
 - none (specification only; no code changed)
---

## Prompt

`/sp.specify` invoked with the attached document `claude_invoice_sub_description_prompt.md`; no additional inline text was supplied. The document, verbatim:

# Claude AI Development Prompt: Optional Product Sub-Description in Sales Invoice

## Objective
Enhance the existing Sales Invoice module with an optional **Product Sub-Description** per invoice line, so products with the same HS Code and Product Name can have different specifications without creating duplicate Item Master records.

## 1. Business Requirement
Some products share an HS Code and Product Name but vary by size, color, dimensions, or specifications.

**Example**
- HS Code: `1111.2222`
- Product Name: `Ink Roll`
- Variations: `Size 20mm`, `Size 30mm`, `Size 50mm`

Maintain one Item Master product and allow the user to enter the variation on each invoice line.

## 2. Functional Requirements

### Product lookup
1. When the user enters or selects an HS Code, use the existing Item Master lookup to retrieve the associated Product Name.
2. Automatically populate the Product Name without changing the stored Item Master record.
3. Add an optional editable **Sub-Description** field to each invoice line.
4. Leave Sub-Description empty by default.
5. Each invoice line must retain its own independent Sub-Description, including when multiple lines use the same HS Code.
6. Preserve existing product selection and HS Code mapping behavior. If an HS Code matches multiple products, follow the application's existing selection rules rather than arbitrarily choosing one.

### Description merging
When displaying or submitting an invoice, use:

- Product Name: `Ink Roll`
- Sub-Description: `Size 30mm`
- Final description: `Ink Roll - Size 30mm`

If Sub-Description is blank or whitespace, use only `Ink Roll` (no separator).

```javascript
const finalProductDescription = subDescription?.trim()
  ? `${productName} - ${subDescription.trim()}`
  : productName;
```

Use the same merging rule consistently in the invoice preview, printed invoice, PDF, and FBR payload.

## 3. FBR API Integration
1. Keep the HS Code and all other existing FBR fields unchanged.
2. Send the merged description in the existing `productDescription` field.
3. If Sub-Description is empty, send only the original Product Name.
4. Do not alter tax calculations, totals, or unrelated FBR validation logic.
5. Continue to apply existing FBR validation and field-length constraints.

**With Sub-Description:**

```json
{
  "hsCode": "1111.2222",
  "productDescription": "Ink Roll - Size 30mm",
  "quantity": 1,
  "uoM": "Numbers, pieces, units"
}
```

**Without Sub-Description:**

```json
{
  "hsCode": "1111.2222",
  "productDescription": "Ink Roll",
  "quantity": 1,
  "uoM": "Numbers, pieces, units"
}
```

These JSON snippets illustrate the relevant fields; preserve all other fields required by the existing FBR integration.

## 4. Database and API Changes
1. Inspect the current database schema and identify the Sales Invoice detail table.
2. Add a nullable `SubDescription` column to the invoice detail table, using a data type and length compatible with existing conventions.
3. Provide a safe, rerunnable database migration script appropriate for the project's database engine.
4. Update the existing create, read, update, and invoice detail APIs to save and retrieve Sub-Description.
5. Preserve historical invoice records; NULL or empty Sub-Description must work without errors.
6. Do not modify Item Master product names or create duplicate items.
7. Store Product Name and Sub-Description separately; generate the merged description for output and submission.

## 5. Sales Invoice UI
1. Keep the existing HS Code and Product Name fields.
2. Add an optional Sub-Description input in the item-entry section.
3. Retain each line's Sub-Description during edits, saves, reloads, and reordering.
4. Display the merged description in invoice preview, printed invoice, and PDF output.
5. Preserve the existing visual layout as much as possible.

## 6. Acceptance Criteria

| Scenario | Expected Result |
|---|---|
| Select HS Code `1111.2222` | Existing lookup retrieves `Ink Roll` where the mapping is unambiguous |
| Enter `Size 30mm` | Final description is `Ink Roll - Size 30mm` |
| Leave Sub-Description blank | Final description is `Ink Roll` |
| Enter only spaces | Final description is `Ink Roll` |
| Use same product on multiple lines | Each line keeps its own Sub-Description |
| Save and reopen invoice | Sub-Description is correctly restored |
| Edit Sub-Description | Updated value is saved and displayed |
| Submit to FBR | `productDescription` contains the merged value |
| Preview, print, or export PDF | Merged description appears consistently |
| Open existing invoices | No regression or errors |

## 7. Claude Implementation Instructions
1. First inspect the existing frontend, backend, database schema, and FBR integration.
2. Identify the exact files, components, APIs, and tables requiring changes.
3. Reuse the existing product lookup and invoice workflows.
4. Implement the smallest safe set of changes without altering unrelated business logic.
5. Include the database migration and any necessary model, validation, API, and UI updates.
6. Verify create, edit, view, print, PDF, and FBR submission paths.
7. Test blank, whitespace-only, and populated Sub-Descriptions, multiple invoice lines, and old invoices.
8. Report files changed, database migration instructions, tests performed, and any remaining limitations.

## Final Goal
Allow one Item Master product to be reused with optional, invoice-line-specific specifications. Merge Product Name and Sub-Description for invoice display and FBR submission while preserving the original Item Master data and existing invoice behavior.

## Response snapshot

Created branch `001-invoice-sub-description` and wrote the specification plus its quality checklist. No code was changed — this is a specification-only step.

The source document was translated into three prioritised, independently testable user stories (capture the variation; it survives save and reopen; it appears identically everywhere), 19 functional requirements, six measurable success criteria, and explicit Assumptions / Dependencies / Out of Scope sections.

Two deliberate departures from the source document:

1. **Implementation detail was stripped.** The document named a specific column, data type, and a JavaScript merge snippet. The spec restates these as behaviour — the two values are stored separately, the merge happens at display or submission — and leaves the mechanics to `/sp.plan`.

2. **A missing, high-risk consequence was added.** Inspection of the codebase showed stock is derived by matching invoice lines to catalogue products on HS Code **and** product name, in three live places: the item stock calculation, the inventory report, and the dashboard statistics. Writing a merged description into the invoice line's product name would silently stop sold quantities from being counted and overstate stock. Captured as FR-011, reinforced by FR-019 and SC-005.

One risk carried forward: FR-017 requires warning the user when a merged description would exceed the accepted length rather than truncating it. The invoice line's description capacity and FBR's own field rules must be reconciled during planning.

## Outcome

- ✅ Impact: Feature 001 specified and validated; ready for `/sp.clarify` or `/sp.plan`.
- 🧪 Tests: None — specification only, no code changed.
- 📁 Files: `specs/001-invoice-sub-description/spec.md`, `specs/001-invoice-sub-description/checklists/requirements.md`
- 🔁 Next prompts: `/sp.plan` to design the storage, API, and output changes; `/sp.clarify` first if the length-limit behaviour in FR-017 needs pinning down.
- 🧠 Reflection: Reading the code before writing the spec was what surfaced the stock-matching constraint. A spec written from the source document alone would have been internally consistent and still led to a silent stock regression.

## Evaluation notes (flywheel)

- Failure modes observed: `create-new-feature.ps1` failed partway under Windows PowerShell 5.1 — the `history/prompts` directory is built with a three-argument `Join-Path`, which requires PowerShell 7. The branch and spec file were created before the error; the prompts directory was created manually. The script's JSON output was never emitted. Worth fixing for anyone else on PowerShell 5.1.
- Graders run and results (PASS/FAIL): Spec quality checklist — PASS (16/16 after one correction iteration).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): During `/sp.plan`, confirm the real length ceiling for a merged description by checking both the invoice record's capacity and FBR's documented field limit, so FR-017 can be made concrete rather than conditional.
