# Changelog / Existing Project Context

This file is a Claude handoff record for the existing project. It is intentionally not a fabricated chronological Git history.

## Migration Baseline

- Existing application was developed with AI assistance using a Trae-based workflow.
- Claude Code is being introduced as the next development assistant.
- The application should be continued in-place rather than rewritten.
- Existing source code, SQL migrations, FBR behavior, and UI should be treated as the baseline.

## Existing Notable Features

- Multi-tenant company management
- JWT authentication and role-based access
- Sales invoice create/edit/list workflow
- FBR digital invoice integration
- FBR scenario mapping/validation
- Items, customers, vendors, purchases
- Reports/dashboard
- Invoice printing/PDF-related utilities
- Global input restrictions in `src/App.tsx`
- Advance tax, further tax, extra tax, discount and other invoice-item fields in the current implementation/migration history

## Important

When a future change is requested, add a concise dated entry here describing the actual implemented change and affected files. Do not invent historical entries.
