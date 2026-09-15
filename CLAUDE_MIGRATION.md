# Trae AI → Claude Code Migration

## What was changed

This migration does **not** convert React code into a different programming language or framework. Claude Code can work directly with the existing React/TypeScript project.

The migration adds a persistent project context layer:

- `CLAUDE.md`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `BUSINESS_RULES.md`
- `API_DOCUMENTATION.md`
- `DATABASE.md`
- `CHANGELOG.md`

These files explain the existing architecture and establish rules for safe incremental development.

## Why this is needed

Trae's previous conversational/project context is not automatically available to Claude. The source code remains the real application, while these documents give Claude the project's architecture, business rules, security boundaries, and workflow.

## Recommended Claude Code startup prompt

```text
Read CLAUDE.md first.

Then read:
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- BUSINESS_RULES.md
- API_DOCUMENTATION.md
- DATABASE.md
- CHANGELOG.md

After reading them, inspect the actual source code and verify that the documentation matches the implementation.

Do not modify any code yet.

Give me:
1. Project architecture
2. Frontend structure
3. Backend structure
4. API flow
5. Database/migration structure
6. Authentication and RBAC
7. Multi-tenant/company isolation
8. FBR integration flow
9. Main invoice/tax calculations
10. Existing risks/inconsistencies
11. Recommended next steps

Wait for my approval before making code changes.
```

## Important

Do not include `.env` files or secrets in a Claude context package or Git repository.
