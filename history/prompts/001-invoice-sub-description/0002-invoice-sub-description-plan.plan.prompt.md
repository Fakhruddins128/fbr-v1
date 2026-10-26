---
id: 0002
title: Invoice Sub-Description Implementation Plan
stage: plan
date: 2026-10-26
surface: agent
model: claude-opus-5
feature: 001-invoice-sub-description
branch: 001-invoice-sub-description
user: Fakhruddins128
command: /sp.plan
labels: ["sales-invoice", "fbr", "stock-integrity", "plan", "mssql"]
links:
  spec: specs/001-invoice-sub-description/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-invoice-sub-description/plan.md
 - specs/001-invoice-sub-description/research.md
 - specs/001-invoice-sub-description/data-model.md
 - specs/001-invoice-sub-description/quickstart.md
 - specs/001-invoice-sub-description/contracts/invoice-items.openapi.yaml
 - CLAUDE.md
tests:
 - none (planning only; no code changed)
 - OpenAPI contract parsed and asserted with js-yaml
---

## Prompt

`/sp.plan` invoked with no additional inline text.

Outline followed, verbatim from the command:

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.
2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).
3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to: Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION"); Fill Constitution Check section from constitution; Evaluate gates (ERROR if violations unjustified); Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION); Phase 1: Generate data-model.md, contracts/, quickstart.md; Phase 1: Update agent context by running the agent script; Re-evaluate Constitution Check post-design.
4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

Phase 0 required extracting unknowns into research tasks and consolidating findings as Decision / Rationale / Alternatives considered. Phase 1 required entities to `data-model.md`, API contracts to `/contracts/`, and an agent context update via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`. Key rules: use absolute paths; ERROR on gate failures or unresolved clarifications.

## Response snapshot

Generated all Phase 0 and Phase 1 artifacts. No application code changed.

**Constitution gate — reported as NOT EVALUABLE rather than PASS.** `.specify/memory/constitution.md` is still the unfilled template (`[PRINCIPLE_1_NAME]`, `[SECTION_2_CONTENT]`). Marking the gate green against placeholders would be false. Instead the plan checks against the project's prior written rules, recovered from `git show HEAD:CLAUDE.md` — SpecKit's init replaced that file, but the rules survive in git. All eight relevant rules pass. `/sp.constitution` is recommended, seeded from that history.

**The finding that shaped the whole plan.** Stock is never stored in this application; it is recomputed on every read by matching invoice lines to catalogue products on HS Code **and** product name. Four sites depend on that equality:

| # | Site | Failure if merged value is stored |
|---|---|---|
| 1 | `backend/server.js:3271` — `/api/items` stock | Sold stops counting; stock overstates everywhere |
| 2 | `backend/server.js:5325` — Inventory Report | Sold reads 0 |
| 3 | `backend/server.js:5533` — dashboard stats | Stock overstates |
| 4 | `src/pages/SalesInvoice.tsx:1302` — `getAvailableStock` | False "exceeds available stock" on edit |

All four fail silently. Writing the merged description into `ProductDescription` is the obvious implementation, so the invariant is now stated in five artifacts — spec FR-011, research R2, data-model, the contract's field description, and quickstart §4 as an explicit verification step.

**A second trap found while reading.** `determineFbrScenario()` (`src/pages/SalesInvoice.tsx:1540-1546`) picks the FBR tax scenario by substring-matching the description for `scrap`, `ship breaking`, `ship breaker`. Feeding it the merged value would let a user's free-text variation change which tax scenario is submitted. Research R4 keeps scenario detection on the unmerged product name.

**One unknown, isolated rather than guessed.** FBR's maximum length for `productDescription` is not documented in this repo and `fbrUtils.ts:62` only checks presence. Rather than hard-code a guess, R5 puts it behind one named constant defaulting to 255 (matching `NVARCHAR(255)`), to be confirmed against FBR documentation before release. Spec FR-017 forbids silent truncation.

Artifacts: `research.md` (R1–R7, each as Decision / Rationale / Alternatives), `data-model.md` (one nullable column, merge truth table, invariant), `contracts/invoice-items.openapi.yaml` (delta only — validated with js-yaml), `quickstart.md` (walkthrough, the stock verification, regression surface, rollback), `plan.md` (five implementation phases ordered riskiest-first).

## Outcome

- ✅ Impact: Feature 001 planned end to end; ready for `/sp.tasks`.
- 🧪 Tests: None run — planning only. The OpenAPI contract was parsed and asserted with js-yaml.
- 📁 Files: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/invoice-items.openapi.yaml`, plus `CLAUDE.md` updated by the agent-context script.
- 🔁 Next prompts: `/sp.tasks` to break Phases A–E into tasks — the stock invariant should become a test before any merge code is written. `/sp.constitution` separately, since the gate could not be evaluated.
- 🧠 Reflection: The plan's value was not in the column — that part was given. It was in finding the four silent dependents of `ProductDescription` and the scenario-detection substring match, neither of which the source requirement mentioned. Both came from reading call sites rather than trusting the requirement's framing.

## Evaluation notes (flywheel)

- Failure modes observed: The constitution gate had no content to evaluate against, which the template assumes will exist. Reporting "NOT EVALUABLE" with a fallback check preserved the gate's intent without faking a pass. Separately, `create-new-feature.ps1` remains broken on Windows PowerShell 5.1 (three-argument `Join-Path`); `setup-plan.ps1` and `update-agent-context.ps1` both ran cleanly.
- Graders run and results (PASS/FAIL): Placeholder scan across all four markdown artifacts — PASS (0 unresolved). OpenAPI parse + field assertions — PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): In `/sp.tasks`, make the very first task a failing test that asserts `InvoiceItems.ProductDescription` still equals the catalogue name after saving a line with a sub-description. That converts the plan's central risk from prose into a gate.
