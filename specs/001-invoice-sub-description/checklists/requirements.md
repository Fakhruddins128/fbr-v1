# Specification Quality Checklist: Optional Product Sub-Description on Sales Invoice Lines

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-26
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes

**Iteration 1** — two issues found and corrected:

1. *Implementation detail leaked into the requirements.* The source document named a specific database column, a data type, and a code snippet for the merge. These were removed from the spec and restated as behaviour: FR-010 says the two values are stored separately and the merge happens at display or submission time, without naming a column or type. Those details belong in `/sp.plan`.

2. *A material consequence was missing entirely.* The source document did not mention that stock is derived by matching invoice lines to catalogue products on HS Code **and** product name. Storing a merged description in the invoice line's product name would silently stop sold quantities from counting and overstate stock. This was added as FR-011, reinforced by FR-019 and SC-005, and recorded under Dependencies. It is the single highest-risk aspect of this feature and the spec would have been incomplete without it.

**Iteration 2** — all items pass. No [NEEDS CLARIFICATION] markers were needed: the source document was specific about the merge rule, the separator, the blank and whitespace behaviour, and the FBR field, and reasonable defaults covered the rest (recorded under Assumptions).

**Open risk carried into planning**: FR-017 requires the user to be warned when a merged description would exceed the accepted length, rather than it being truncated. The exact limit is an implementation question for `/sp.plan` — it depends on both the invoice record's capacity and FBR's own field rules, which must be reconciled.
