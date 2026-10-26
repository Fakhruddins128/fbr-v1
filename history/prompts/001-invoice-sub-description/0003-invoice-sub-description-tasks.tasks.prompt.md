---
id: 0003
title: Invoice Sub-Description Task Breakdown
stage: tasks
date: 2026-10-26
surface: agent
model: claude-opus-5
feature: 001-invoice-sub-description
branch: 001-invoice-sub-description
user: Fakhruddins128
command: /sp.tasks
labels: ["sales-invoice", "fbr", "stock-integrity", "tasks", "mssql"]
links:
  spec: specs/001-invoice-sub-description/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-invoice-sub-description/tasks.md
tests:
 - none run (planning artifact; no code changed)
 - tasks.md format validated programmatically (51/51 conform)
---

## Prompt

`/sp.tasks` invoked with no additional inline text.

Outline followed, verbatim from the command:

1. **Setup**: Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.
2. **Load design documents**: Read from FEATURE_DIR — required plan.md (tech stack, libraries, structure) and spec.md (user stories with priorities); optional data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios). Not all projects have all documents; generate tasks based on what's available.
3. **Execute task generation workflow**: Load plan.md and extract tech stack, libraries, project structure. Load spec.md and extract user stories with their priorities. If data-model.md exists, extract entities and map to user stories. If contracts/ exists, map endpoints to user stories. If research.md exists, extract decisions for setup tasks. Generate tasks organized by user story. Generate dependency graph showing user story completion order. Create parallel execution examples per user story. Validate task completeness.
4. **Generate tasks.md** using `.specify/templates/tasks-template.md` as structure: correct feature name from plan.md; Phase 1 Setup; Phase 2 Foundational (blocking prerequisites for all user stories); Phase 3+ one phase per user story in priority order; each phase includes story goal, independent test criteria, tests (if requested), implementation tasks; final Phase Polish; all tasks following the strict checklist format; clear file paths; Dependencies section; parallel execution examples; implementation strategy section.
5. **Report**: Output path to generated tasks.md and summary — total task count, task count per user story, parallel opportunities, independent test criteria per story, suggested MVP scope, and format validation confirming ALL tasks follow the checklist format.

Tests are OPTIONAL — only generate test tasks if explicitly requested in the feature specification or if the user requests TDD.

Checklist format required: `- [ ] [TaskID] [P?] [Story?] Description with file path`, with story labels on user-story phases only.

## Response snapshot

Generated `specs/001-invoice-sub-description/tasks.md` — 51 tasks across six phases. No code changed.

**Phase shape**: Setup 4 · Foundational 9 · US1 7 · US2 15 · US3 10 · Polish 6.

**Tests included, narrowly.** The source requirement asked for blank / whitespace-only / populated cases, multiple lines and old invoices to be covered, which counts as an explicit request. Scope was kept to the merge rule (a pure function, cheap to cover exhaustively) and the stock invariant, rather than a full pyramid. Recorded honestly in the file: there is no backend test harness in this repo and adding one is out of scope, so backend verification is manual and explicit.

**Story split chosen so each is independently demonstrable**:

- US1 — capture on screen, testable without saving anything
- US2 — persistence, testable by save-and-reopen
- US3 — outputs and FBR, depends only on the merge helper, so a second person can build it in parallel

**T034 is the task the whole plan exists for.** It verifies `InvoiceItems.ProductDescription` still holds the catalogue name alone after a sub-description is saved, then checks all four stock readers agree. It sits inside US2 rather than in final polish, so the invariant is proven the moment persistence lands. T004 pairs with it by capturing the pre-change stock figure to compare against — without that baseline the check is unfalsifiable.

**Deliberate non-change recorded as a task.** T048 confirms the Sales Register and Inventory Report keep showing the plain product name, since FR-009 lists five output paths and the registers are not among them, and the spec's Out of Scope excludes sub-description as a reporting dimension. It is documented rather than silently left inconsistent.

**Format validated programmatically**: all 51 tasks match `- [ ] T### [P?] [US#?] description`, IDs are sequential T001–T051 with no duplicates, and story labels appear only on user-story phases. 38 carry an explicit file path or command; the remaining 13 are manual verification steps, which is appropriate — two that were code checks (T027, T050) were amended to carry paths.

## Outcome

- ✅ Impact: Feature 001 fully broken down; ready for `/sp.implement`.
- 🧪 Tests: None run — this is a planning artifact. `tasks.md` format validated programmatically (51/51 conform, IDs sequential, labels correct).
- 📁 Files: `specs/001-invoice-sub-description/tasks.md`
- 🔁 Next prompts: `/sp.implement` to execute, starting with Phase 1. `/sp.analyze` first if a cross-artifact consistency check is wanted before writing code. `/sp.constitution` still outstanding from the plan stage.
- 🧠 Reflection: The ordering decision that mattered was putting the stock-invariant check inside US2 instead of final polish. Verification placed at the end discovers a silent data problem after everything is built on top of it; placed at the moment persistence lands, it fails cheaply.

## Evaluation notes (flywheel)

- Failure modes observed: None in this step. `check-prerequisites.ps1` ran cleanly and reported all four optional design documents present. The PowerShell 5.1 bug in `create-new-feature.ps1` noted at the spec stage remains unfixed but does not affect `/sp.tasks`.
- Graders run and results (PASS/FAIL): Checklist-format validation — PASS (51/51). Sequential-ID and duplicate check — PASS. Story-label-by-phase check — PASS. File-path coverage — PASS with 13 justified exceptions.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): During `/sp.implement`, run T034 immediately after T026 rather than after the whole of US2, so the stock invariant is checked against the first persisted row rather than a completed story.
