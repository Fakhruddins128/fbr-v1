---
id: 0004
title: Implement Invoice Sub-Description
stage: green
date: 2026-10-26
surface: agent
model: claude-opus-5
feature: 001-invoice-sub-description
branch: 001-invoice-sub-description
user: Fakhruddins128
command: /sp.implement
labels: ["sales-invoice", "fbr", "stock-integrity", "implementation", "mssql"]
links:
  spec: specs/001-invoice-sub-description/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/database/add_sub_description_to_invoice_items.sql
 - backend/server.js
 - src/utils/invoiceDescription.ts
 - src/utils/invoiceDescription.test.ts
 - src/utils/invoiceDescription.invariant.test.ts
 - src/utils/fbrUtils.ts
 - src/pages/SalesInvoice.tsx
 - src/components/SalesInvoiceReport.tsx
 - src/types/index.ts
 - specs/001-invoice-sub-description/tasks.md
 - CHANGELOG.md
 - .gitignore
tests:
 - src/utils/invoiceDescription.test.ts — 17 passed
 - src/utils/invoiceDescription.invariant.test.ts — 6 passed
 - full suite — 28 passed; src/App.test.tsx suite fails (pre-existing CRA boilerplate)
 - npx tsc --noEmit — clean
 - npm run build — Compiled successfully
 - node --check backend/server.js — OK
---

## Prompt

`/sp.implement` invoked with no additional inline text.

Outline followed, verbatim from the command:

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.
2. **Check checklists status** (if FEATURE_DIR/checklists/ exists): scan all checklist files, count total/completed/incomplete items, build a status table, and calculate overall status. PASS when all checklists have 0 incomplete items; FAIL otherwise. If any checklist is incomplete, display the table, STOP and ask whether to proceed, and wait for the user. If all complete, display the table and proceed automatically.
3. Load and analyze the implementation context: REQUIRED tasks.md and plan.md; IF EXISTS data-model.md, contracts/, research.md, quickstart.md.
4. **Project Setup Verification**: create/verify ignore files based on actual project setup — .gitignore if a git repo, .dockerignore if Docker present, .eslintignore if .eslintrc* present, eslint.config.* `ignores` entries, .prettierignore, .npmignore, .terraformignore, .helmignore as applicable. If an ignore file exists, verify essential patterns and append missing critical ones only; if missing, create with the full pattern set for the detected technology. Common patterns listed per technology and per tool.
5. Parse tasks.md structure and extract task phases, dependencies, details (ID, description, file paths, parallel markers) and execution flow.
6. Execute implementation following the task plan: phase-by-phase, respecting dependencies, sequential vs parallel [P], TDD ordering where tests exist, file-based coordination, validation checkpoints.
7. Implementation execution rules: setup first; tests before code where contract/entity/integration tests are needed; core development; integration work; polish and validation.
8. Progress tracking and error handling: report progress per task, halt on non-parallel failure, continue past failed [P] tasks, clear error messages, suggest next steps. **IMPORTANT** mark completed tasks off as [X] in the tasks file.
9. Completion validation: verify required tasks complete, features match the specification, tests pass, implementation follows the plan, report final status.

## Response snapshot

Checklist gate: `requirements.md` 16/16 complete — PASS, proceeded automatically.

Implemented 38 of 51 tasks. The other 13 need a live SQL Server or a browser, neither of which is available here; they are left unchecked rather than marked done.

**Built**: guarded rerunnable migration adding `InvoiceItems.SubDescription NVARCHAR(255) NULL`; `src/utils/invoiceDescription.ts` holding the merge rule, the normaliser and the length constant in one place; the Sub-Description input on the invoice line with inline length feedback; `SubDescription` threaded through four `sys.columns` probes, four SELECT lists, two read mappers and two insert paths in `backend/server.js`; the merged description rendered in all four report templates and sent to FBR; length enforced in `fbrUtils` and submission blocked before the payload is shown for approval.

**The invariant test earned its place immediately.** `invoiceDescription.invariant.test.ts` asserts at source level that the save payload sends `productDescription` unmerged, that the backend never concatenates, that the four stock matchers still compare against the unmerged name, and that scenario detection is not fed the merged value. On its first run it **failed** — and correctly so: an earlier patch script had thrown before writing, so the save and preview payloads had silently never been wired. Without that test the gap would have reached the manual verification step at best, or production at worst.

**Two process notes.** A patch script matched a 10-space-indented anchor inside a 12-space line and aborted mid-way, leaving `hasSubDescription` referenced but undeclared — caught by grepping declarations against usages, since `node --check` cannot see a runtime ReferenceError. Anchors were widened to include the preceding line thereafter.

**Pre-existing failure, not caused by this work**: `src/App.test.tsx` is untouched CRA boilerplate asserting a "learn react" link that exists nowhere in this application; its suite fails to resolve `react-router-dom` under Jest. Confirmed untouched via `git diff HEAD`. Left alone as out of scope.

Verification run: tsc clean, production build compiles, `node --check` OK, 28 tests pass across the three real suites.

## Outcome

- ✅ Impact: Feature 001 implemented end to end in code. 38/51 tasks complete; 13 require a database or browser.
- 🧪 Tests: 23 feature tests written and passing (17 merge rule, 6 invariant); 28 total across the suite; typecheck, build and backend syntax all clean.
- 📁 Files: 1 migration, 1 new util, 2 new test files, and edits to `backend/server.js`, `src/pages/SalesInvoice.tsx`, `src/components/SalesInvoiceReport.tsx`, `src/utils/fbrUtils.ts`, `src/types/index.ts`, plus `CHANGELOG.md`, `.gitignore` and `tasks.md`.
- 🔁 Next prompts: apply the migration and work T004 → T006/T007 → T031-T034 → T043-T045 → T047 → T051. T034 is the one that matters: it proves stock still moves.
- 🧠 Reflection: Writing the invariant as an executable test rather than a prose warning is what caught the real defect. Three artifacts already said "do not merge into ProductDescription" and the bug that occurred was adjacent — the field simply never got wired — which no amount of prose would have surfaced.

## Evaluation notes (flywheel)

- Failure modes observed: (1) A multi-edit patch script aborting mid-sequence left the file unwritten while earlier edits in the same script appeared to have succeeded from their log lines — the real state had to be re-derived by grep. (2) Substring collision between differently-indented anchors. (3) Stale CRA boilerplate test pollutes the suite result and would mask a genuine regression in CI.
- Graders run and results (PASS/FAIL): tsc — PASS. Production build — PASS. `node --check` — PASS. Feature tests 23/23 — PASS. Full suite — PASS on all three real suites; `App.test.tsx` FAIL (pre-existing). Checklist gate 16/16 — PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Delete or rewrite `src/App.test.tsx`. It has never passed, and a permanently red suite trains everyone to ignore the test output, which is precisely when a real failure slips through.
