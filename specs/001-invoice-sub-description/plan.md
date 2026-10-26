# Implementation Plan: Optional Product Sub-Description on Sales Invoice Lines

**Branch**: `001-invoice-sub-description` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-invoice-sub-description/spec.md`

## Summary

Add one optional free-text field to each sales invoice line so a single catalogue product can carry line-specific variations ("Ink Roll" + "Size 30mm") without duplicating Item Master records.

The approach is deliberately narrow: store the variation in a new nullable `InvoiceItems.SubDescription` column, leave `ProductDescription` holding the catalogue name exactly as today, and merge the two into `"name - variation"` at each display and submission boundary.

That last decision is the whole plan. Stock in this application is not stored — it is recomputed on every read by matching invoice lines back to catalogue products on HS Code **and** product name, in four separate places. Writing the merged value into `ProductDescription` is the obvious implementation and it silently breaks all four: sold quantities stop counting and stock overstates, with no error anywhere. Everything below is arranged so that cannot happen.

## Technical Context

**Language/Version**: TypeScript 4.x on React 19 (frontend); Node.js with Express 4.18 (backend)
**Primary Dependencies**: Material UI 7.3, Redux Toolkit 2.x, React Router 7.x, `mssql`, jsPDF, XLSX
**Storage**: Microsoft SQL Server — shared database, shared schema, `CompanyID` tenant isolation
**Testing**: Jest + React Testing Library via `react-scripts test`; `node --check` for API syntax; no backend test harness exists
**Target Platform**: Browser SPA served statically; Node API; SQL Server
**Project Type**: Web — existing `src/` frontend and `backend/` API
**Performance Goals**: No change. One nullable column and a string concatenation at render; no new queries, no new round trips.
**Constraints**: Merged description must not exceed the FBR field limit — exact figure undocumented in this repo, isolated to one constant defaulting to 255 (research R5). Invoices already submitted to FBR are locked and this field inherits that.
**Scale/Scope**: 1 migration, 1 column, ~6 frontend files, ~4 backend handler sites. No new endpoints, no new screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ⚠️ Gate status: NOT EVALUABLE — constitution is an unfilled template

`.specify/memory/constitution.md` still contains its placeholders (`[PRINCIPLE_1_NAME]`, `[SECTION_2_CONTENT]`, …). There are no ratified principles to check against, so this gate cannot pass or fail on its own terms. It is recorded as unevaluated rather than silently marked "PASS".

**This is not a blocker for this feature** — the change is small, additive and reversible — but it should be fixed before anything larger. Run `/sp.constitution`.

Compounding the gap: the project's engineering rules *were* written down in `CLAUDE.md` and were replaced when SpecKit initialised. They remain in git history (`git show HEAD:CLAUDE.md`) and are the obvious seed for a real constitution.

### Checked against the project's prior written rules instead

Recovered from `git show HEAD:CLAUDE.md`, these are the constraints the codebase has actually been held to:

| Rule (from prior CLAUDE.md) | Status | Note |
|---|---|---|
| Multi-tenant, `CompanyID` isolation preserved | ✅ PASS | No endpoint changes, no query scoping changes |
| Backend authorization / tenant filtering not weakened | ✅ PASS | No auth surface touched |
| FBR payload types and field formats unchanged | ✅ PASS | Same `productDescription` field, same type; only its value composition changes, which is the requested behaviour |
| Invoice calculations, tax rules, scenario mapping preserved | ✅ PASS | Research R4 explicitly keeps scenario detection reading the unmerged name, so a free-text field cannot alter tax scenario selection |
| FBR-numbered invoices treated as finalized/locked | ✅ PASS | New field inherits existing lock, no new locking logic |
| Existing migrations not rewritten | ✅ PASS | New additive guarded script; nothing edited |
| Parameterized SQL only | ✅ PASS | New column read/written through existing parameterised inserts |
| Smallest viable change, no unrelated refactor | ✅ PASS | One column; the `MasterItemID` refactor that would make R2 unnecessary is explicitly deferred |

### Post-Phase 1 re-check

Re-evaluated after design. No change — the design added no endpoints, no dependencies, no new tables, and no cross-tenant surface. The one judgement call (merge at render rather than at save) *strengthens* compliance, because it is what preserves the stock invariant.

## Project Structure

### Documentation (this feature)

```text
specs/001-invoice-sub-description/
├── plan.md                              # This file
├── spec.md                              # /sp.specify output
├── research.md                          # Phase 0 — R1..R7
├── data-model.md                        # Phase 1
├── quickstart.md                        # Phase 1
├── checklists/
│   └── requirements.md                  # Spec quality checklist
├── contracts/
│   └── invoice-items.openapi.yaml       # Phase 1 — contract delta only
└── tasks.md                             # /sp.tasks — NOT created here
```

### Source Code (repository root)

```text
backend/
├── server.js                            # invoice create/read/update handlers;
│                                        # add SubDescription to 4 sys.columns probes
└── database/
    └── add_sub_description_to_invoice_items.sql   # NEW — guarded, rerunnable

src/
├── pages/
│   ├── SalesInvoice.tsx                 # sub-description input; merge for payload;
│   │                                    # leave getAvailableStock + scenario detection alone
│   └── Invoices.tsx                     # list preview passes lines through
├── components/
│   └── SalesInvoiceReport.tsx           # preview + print + PDF, all four templates
├── utils/
│   ├── fbrUtils.ts                      # validate the merged value
│   └── invoiceDescription.ts            # NEW — the single merge helper
└── types/
    └── index.ts                         # subDescription on the line type
```

**Structure Decision**: Existing web layout — `src/` frontend, `backend/` API. No new top-level directories. One new frontend util module so the merge rule has exactly one definition (FR-009 requires five call sites to agree; duplicating the rule five times is how they stop agreeing).

## Implementation phases

Ordered so the riskiest thing is provable first.

**Phase A — storage, inert.** Migration; add `SubDescription` to the four `sys.columns` probes and to the insert/select column lists; accept and return `subDescription` through create/read/update. No UI. Verifiable by saving a line via the API and reading it back, with stock figures unmoved.

**Phase B — the merge helper, with tests.** `src/utils/invoiceDescription.ts` plus unit tests driven by the table in [data-model.md](./data-model.md) — blank, whitespace, trimming, embedded separator, null. Pure function, no UI, fast to get right.

**Phase C — capture.** The input on the invoice line; state wiring; preserve the value through edit, save, reload, add and remove line.

**Phase D — output.** Apply the helper at preview, print, PDF, and the FBR payload. Length validation and the FR-017 warning.

**Phase E — regression.** Walk [quickstart.md](./quickstart.md) §4 and §5 in full, particularly the four stock readers.

## Risks

| Risk | Mitigation |
|---|---|
| Merged value written into `ProductDescription`, silently breaking stock in four places | The invariant is stated in spec FR-011, research R2, data-model, the contract's field description, and quickstart §4 as an explicit verification step. It is the first thing `/sp.tasks` should turn into a test. |
| A sub-description containing "scrap" flips the FBR tax scenario | Research R4 — scenario detection keeps reading the unmerged product name |
| Real FBR length limit differs from the assumed 255 | Isolated to one named constant (research R5); confirm against FBR documentation before release |

## Complexity Tracking

> No constitution violations to justify. The gate was not evaluable (empty constitution) rather than failed, and the design introduces no new projects, patterns or dependencies.

## Follow-ups (not this feature)

- Fill the constitution — `/sp.constitution`, seeded from `git show HEAD:CLAUDE.md`.
- Fix `create-new-feature.ps1`: its three-argument `Join-Path` requires PowerShell 7 and fails on Windows PowerShell 5.1.
- Consider keying stock on `MasterItemID` instead of HS Code + product name, which would retire the R2 constraint entirely.
