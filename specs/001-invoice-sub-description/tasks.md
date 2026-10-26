---
description: "Task list for 001-invoice-sub-description"
---

# Tasks: Optional Product Sub-Description on Sales Invoice Lines

**Input**: Design documents from `/specs/001-invoice-sub-description/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The source requirement asked for blank / whitespace-only / populated cases, multiple lines, and old invoices to be tested, and the merge rule is a pure function that is cheap to cover exhaustively. Test scope is deliberately narrow — the merge rule and the stock invariant — not a full pyramid. There is no backend test harness in this repo and adding one is out of scope; backend verification is manual and explicit (T034).

**Organization**: Grouped by user story so each can be implemented, tested and demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 — maps to the user stories in spec.md

## Path Conventions

Web app: `src/` (React frontend), `backend/` (Express API), `backend/database/` (SQL migrations).

---

## ⚠️ Read before starting

Stock is **derived, not stored**. It is recomputed on every read by matching invoice lines to catalogue products on HS Code **and** product name, in four places (research R2). `InvoiceItems.ProductDescription` must keep holding the catalogue product name alone. Writing the merged `"Ink Roll - Size 30mm"` there breaks stock silently — no error, just wrong numbers.

T034 exists to catch exactly that. Do not skip it.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before changing anything.

- [X] T001 Confirm branch `001-invoice-sub-description` is checked out and the working tree is clean, via `git status`
- [X] T002 [P] Install dependencies if absent: `npm install` at repo root and `npm install` in `backend/`
- [X] T003 [P] Record the pre-change baseline: run `npx tsc --noEmit -p tsconfig.json`, `npm run build`, and `node --check backend/server.js`, and note that all three pass
- [ ] T004 Capture the current stock figure for one test product from the Items page, to compare against after T034

**Checkpoint**: Baseline green and a known stock number written down.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The schema, the shared types, and the single merge rule. Every user story depends on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create the guarded, rerunnable migration in `backend/database/add_sub_description_to_invoice_items.sql` adding `SubDescription NVARCHAR(255) NULL` to `InvoiceItems`, following the `IF NOT EXISTS (SELECT * FROM sys.columns ...)` pattern used by `backend/database/add_advance_tax_to_invoice_items.sql`
- [X] T006 Apply the migration to the development database and verify with `SELECT name, is_nullable FROM sys.columns WHERE object_id = OBJECT_ID('InvoiceItems') AND name = 'SubDescription'`
- [ ] T007 Run the migration a second time to confirm it is a no-op and raises no error
- [X] T008 [P] Create the merge helper `mergeProductDescription(productName, subDescription)` in `src/utils/invoiceDescription.ts`, returning `name + " - " + trimmed` when the sub-description has non-whitespace content and `name` alone otherwise, per the truth table in `data-model.md`
- [X] T009 [P] Add `MAX_PRODUCT_DESCRIPTION_LENGTH = 255` and `isMergedDescriptionTooLong(productName, subDescription)` to `src/utils/invoiceDescription.ts`, as the single place the limit is defined (research R5)
- [X] T010 Write table-driven unit tests in `src/utils/invoiceDescription.test.ts` covering: populated, empty string, `null`, `undefined`, whitespace-only, leading/trailing whitespace, embedded `" - "` separator, and the length boundary at exactly 255 and 256 characters
- [X] T011 Run `CI=true npx react-scripts test --testPathPattern invoiceDescription --watchAll=false` and confirm all cases pass
- [X] T012 [P] Add optional `subDescription?: string | null` to the invoice line types in `src/types/index.ts` (both line-item interfaces, around lines 63 and 141)
- [X] T013 [P] Add optional `subDescription?: string` to the `InvoiceItem` form interface in `src/pages/SalesInvoice.tsx` (interface beginning line 55)

**Checkpoint**: Column exists, merge rule is proven by tests, types carry the field. User stories can now proceed.

---

## Phase 3: User Story 1 — Record a variation on an invoice line (Priority: P1) 🎯 MVP

**Goal**: A user can type a variation on an invoice line and see the merged description on screen. The catalogue is untouched.

**Independent Test**: Raise an invoice, select a product, type `Size 30mm`, and confirm the line reads `Ink Roll - Size 30mm` while the Items page still shows one `Ink Roll` product. No save required.

### Implementation for User Story 1

- [X] T014 [US1] Add `subDescription: ''` to the initial `currentItem` state and to the item-reset object in `src/pages/SalesInvoice.tsx` (around lines 1186 and 1432), so a new line always starts blank per FR-002
- [X] T015 [US1] Add the optional Sub-Description text input to the item-entry section of `src/pages/SalesInvoice.tsx`, placed after Product Description, labelled "Sub-Description" with helper text indicating it is optional
- [X] T016 [US1] Wire the input through the existing `handleItemChange` path in `src/pages/SalesInvoice.tsx` so typing updates only the line being edited
- [X] T017 [US1] Carry `subDescription` into the new line object built by `addItem` in `src/pages/SalesInvoice.tsx` (around line 1401), so each added line keeps its own value per FR-003
- [X] T018 [US1] Display the merged description for each line in the items grid of `src/pages/SalesInvoice.tsx` using `mergeProductDescription` from T008
- [X] T019 [US1] Confirm the Sub-Description input is disabled when `isInvoiceSentToFBR()` is true in `src/pages/SalesInvoice.tsx`, matching the existing lock on every other line field
- [ ] T020 [US1] Verify no Item Master write occurs: add a line with a sub-description and confirm the product's name on the Items page is unchanged (FR-018)

**Checkpoint**: Variations can be captured and read on screen. Nothing persists yet — that is US2.

---

## Phase 4: User Story 2 — The variation survives saving and reopening (Priority: P1)

**Goal**: Sub-descriptions round-trip through save, reopen, amend and re-save, without disturbing stock.

**Independent Test**: Save an invoice with sub-descriptions on some lines and not others, reopen it, and confirm each line matches what was entered — then confirm stock moved by the invoiced quantity.

### Backend persistence

- [X] T021 [US2] Add `'SubDescription'` to the four `sys.columns` probe lists in `backend/server.js` (lines 237, 389, 585, 995) and derive a `hasSubDescription` flag alongside the existing `hasMasterItemId` / `hasAdvanceTaxValue` flags, so the API still works against a database where T005 has not run (research R7)
- [X] T022 [US2] Add a conditional `subDescriptionSelect` expression in `backend/server.js` mirroring `advanceTaxValueSelect`, returning `SubDescription` when present and `CAST(NULL AS NVARCHAR(255)) AS SubDescription` when absent
- [X] T023 [US2] Include `SubDescription` in the four `InvoiceItems` SELECT lists in `backend/server.js` (lines 272, 425, 799, 1222) via the T022 expression
- [X] T024 [US2] Map `subDescription: item.SubDescription ?? null` in the two camelCase item mappers in `backend/server.js` (lines 306 and 466)
- [X] T025 [US2] Add `SubDescription` to `invoiceItemColumnNames` and `@subDescription` to `invoiceItemParamNames` in both the create and update paths of `backend/server.js` (arrays at lines 614/637 and 1024/1047), guarded by `hasSubDescription`
- [X] T026 [US2] Bind the parameter in both item-insert loops in `backend/server.js` (near lines 739 and 1162) as `.input("subDescription", sql.NVarChar(255), <normalised value>)`, where whitespace-only and empty normalise to `null` per data-model
- [X] T027 [US2] Confirm `productDescription` continues to be bound with the catalogue product name alone in both item-insert loops in `backend/server.js` (lines 739 and 1162) — it must **not** receive the merged value (FR-011)

### Frontend persistence

- [X] T028 [US2] Include `subDescription` in the item payload built by the save path in `src/pages/SalesInvoice.tsx` (items mapping around line 1468), sending the raw typed value and keeping `productDescription` as the catalogue name
- [X] T029 [US2] Restore `subDescription` when loading an invoice for edit in `src/pages/SalesInvoice.tsx` (`loadInvoiceForEdit` item mapping around line 1147), defaulting absent or `null` to `''` so pre-feature invoices open with an empty box (FR-012)
- [X] T030 [US2] Include `subDescription` in the update payload in `src/pages/Invoices.tsx` so amending from the invoice list does not drop the value

### Verification for User Story 2

- [ ] T031 [US2] Save an invoice with three lines of the same product — one with `Size 30mm`, one with `Size 50mm`, one blank — reopen it, and confirm each line returns its own value (FR-003, FR-013)
- [ ] T032 [US2] Clear a saved sub-description, re-save, reopen, and confirm it returns blank and the line reads as the product name alone
- [ ] T033 [US2] Open an invoice created before this feature and confirm it loads, displays and prints with no error and no sub-description (FR-012)
- [ ] T034 [US2] **Stock invariant check — do not skip.** After saving a line with a sub-description, run `SELECT ProductDescription, SubDescription, Quantity FROM InvoiceItems WHERE InvoiceID = '<id>'` and confirm `ProductDescription` holds the catalogue name alone. Then confirm all four readers still agree: Items page Current Stock fell by the invoiced quantity (compare against T004), Inventory Report Sold includes it, dashboard stock is consistent, and reopening the invoice raises no false "exceeds available stock" warning
- [X] T035 [P] [US2] Add a regression test in `src/pages/__tests__/` asserting that the stock add-back matcher in `getAvailableStock` (`src/pages/SalesInvoice.tsx` line 1302) still matches a saved line against its catalogue item when that line carries a sub-description. If the matcher is not reachable from a test without extracting it, extract the comparison into a small named function and test that instead

**Checkpoint**: Variations persist and stock is provably unaffected. Feature is releasable at this point for capture and storage; outputs still show the plain name.

---

## Phase 5: User Story 3 — The variation appears everywhere the invoice does (Priority: P2)

**Goal**: Preview, print, PDF and the FBR submission all carry the identical merged description.

**Independent Test**: Take one saved invoice with sub-descriptions and compare the description on the preview, the printed output, the PDF and the FBR payload — all four must match exactly.

### Document output

- [X] T036 [US3] Accept `subDescription` on the invoice line type in `src/components/SalesInvoiceReport.tsx` and render the merged description via `mergeProductDescription`, applying it in **all four templates** (TemplateOne, TemplateTwo, TemplateThree, TemplateFour)
- [X] T037 [US3] Pass `subDescription` through from the preview path in `src/pages/SalesInvoice.tsx` (`prepareInvoiceData`, around line 2045) into the report component
- [X] T038 [US3] Pass `subDescription` through from both preview sites in `src/pages/Invoices.tsx` (the print handler around line 108 and the dialog around line 1390), which currently hand saved line items straight to the report component

### FBR submission

- [X] T039 [US3] Send the merged value as `productDescription` in `prepareFbrPayload()` in `src/pages/SalesInvoice.tsx`, leaving `hsCode` and every other field untouched (FR-014)
- [X] T040 [US3] Confirm `determineFbrScenario()` in `src/pages/SalesInvoice.tsx` (lines 1540-1546) still reads the **unmerged** product name — a sub-description containing "scrap" must not change the submitted tax scenario (research R4, FR-015)
- [X] T041 [US3] Validate the merged description in `src/utils/fbrUtils.ts` (presence check at line 62) so FBR validation applies to the value actually sent (FR-016)
- [X] T042 [US3] Block submission and show a clear message when `isMergedDescriptionTooLong` returns true, in `src/pages/SalesInvoice.tsx` — never truncate silently (FR-017, SC-006)

### Verification for User Story 3

- [ ] T043 [US3] For one invoice containing both a line with and a line without a sub-description, compare the description shown in the entry grid, the preview, the printed output, the PDF and the FBR payload preview — confirm all five agree (FR-009, SC-003)
- [ ] T044 [US3] Enter a sub-description containing the word `scrap` on an unrelated product and confirm the FBR scenario is unchanged (T040)
- [ ] T045 [US3] Enter a sub-description long enough to push the merged value past 255 characters and confirm the user is warned before submission rather than the value being shortened

**Checkpoint**: All output paths agree. Feature complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T046 [P] Run the full automated suite: `npx tsc --noEmit -p tsconfig.json`, `npm run build`, `CI=true npx react-scripts test --watchAll=false`, `node --check backend/server.js`
- [ ] T047 [P] Walk every case in `quickstart.md` §5, including whitespace-only input, an embedded `" - "` separator, and an invoice already submitted to FBR
- [X] T048 Confirm the Sales Register (`backend/server.js` line 4974) and the Inventory Report still read `ProductDescription` and therefore show the catalogue name without the variation. This is intentional — FR-009 lists five output paths and the registers are not among them, and spec Out of Scope excludes sub-description as a reporting dimension. Record the decision in `CHANGELOG.md` rather than changing it
- [X] T049 [P] Add a `CHANGELOG.md` entry describing the new column, the merge rule, the four stock matchers that constrain it, and the migration command
- [X] T050 Confirm the `MAX_PRODUCT_DESCRIPTION_LENGTH` constant in `src/utils/invoiceDescription.ts` is still flagged as an assumption pending FBR documentation (research R5), and record it as a known limitation in the `CHANGELOG.md` entry
- [ ] T051 Verify the rollback path in `quickstart.md` §8: revert the code, confirm the application still runs against a database that still has the column, then drop the column

---

## Dependencies

```
Phase 1 Setup  →  Phase 2 Foundational  →  ┌─ Phase 3 (US1) ─┐
                                            ├─ Phase 4 (US2) ─┤ → Phase 6 Polish
                                            └─ Phase 5 (US3) ─┘
```

**Story order**: US1 and US2 are both P1 and together form the minimum release. US3 is P2 and depends on the merge helper (T008) only, not on US1 or US2 — it can be built in parallel by a second person, though it cannot be *demonstrated* until US2 persists something to display.

**Hard dependencies**:

- T006 blocks T021–T027 (no column, nothing to persist)
- T008 blocks T018, T036, T039 (the merge rule)
- T009 blocks T042 (the length constant)
- T021 blocks T022–T026 (the probe flag)
- T025 blocks T026 (the column must be in the list before it is bound)
- T004 blocks T034 (nothing to compare against)

---

## Parallel execution examples

**Phase 2** — T008 and T009 touch the same new file and must be sequential; T012 and T013 touch different files and can run alongside them:

```
T008 → T009 → T010 → T011
T012 [P]  ──┐  different files, run anytime in Phase 2
T013 [P]  ──┘
```

**Phase 4** — backend (T021–T027) and frontend (T028–T030) are separate files and can be split between two people, but both must land before the verification tasks T031–T035.

**Phase 5** — T036/T037/T038 (document output) and T039/T040/T041/T042 (FBR) touch different files and can run in parallel.

**Phase 6** — T046, T047 and T049 are independent.

---

## Implementation strategy

**MVP**: Phases 1, 2, 3 and 4 — capture plus persistence. At that point a user can record variations and they survive. Outputs still show the plain product name, which is exactly today's behaviour, so the half-delivered state is coherent rather than broken.

**Increment 2**: Phase 5 — outputs and FBR. This is where the feature becomes visible to the customer and to the tax authority.

**Riskiest thing first**: T034 is the single task that catches the failure this whole design exists to prevent. It is placed inside US2 rather than at the end, so the invariant is proven the moment persistence lands rather than during final polish.

**Total**: 51 tasks — Setup 4, Foundational 9, US1 7, US2 15, US3 10, Polish 6.
