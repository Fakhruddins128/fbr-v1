#[OPEN] Debug Session: invoices-http-500

## Symptom
- Invoices page shows: `HTTP error! status: 500`

## Expected
- Invoices list loads (HTTP 200) and renders rows.

## Hypotheses (falsifiable)
- A) Backend SQL query fails because live DB schema is missing `InvoiceItems.AdvanceTaxRate` and/or `InvoiceItems.AdvanceTaxValue`.
- B) Backend SQL query fails due to SELECT/JSON aggregation mismatch (e.g., selecting a column that isn’t in the table or typo).
- C) Backend connects to DB but startup schema-ensure fails due to permissions, leaving schema unchanged and invoices query failing.
- D) Request reaches a different backend instance (old deployment) that still has outdated SQL (so fixes aren’t applied).
- E) Authentication header/company scope issue triggers an unexpected backend path that throws (less likely, but possible).

## Evidence Plan
- Instrument `/api/invoices` and `/api/invoices/:id` catch blocks to report structured error details to Debug Server.
- Reproduce by refreshing Invoices page.

## Status
- [ ] Instrumentation deployed
- [ ] Reproduced + logs captured
- [ ] Root cause confirmed
- [ ] Fix applied
- [ ] Verified (post-fix)
