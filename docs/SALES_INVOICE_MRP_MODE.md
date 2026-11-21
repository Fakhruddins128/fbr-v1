# Sales Invoice — MRP Mode toggle (Item Detail)

**Status**: Implemented. Migration not yet applied; no screen exercised in a browser (§8)
**Date**: 2026-11-18
**Scope**: Item Detail panel of the Sales Invoice screen
**Source**: Five mockups/specification images supplied 2026-11-18

---

## 1. What the requirement asks for

A toggle in the Item Detail header switches the line between two modes.

**Button ON — MRP mode.** Three extra fields appear (MRP per Item, MRP Value, Discount Value) and the line is priced from retail price downwards:

| Field | Source |
|---|---|
| MRP Value | MRP per Item × Quantity |
| Discount Value | manually entered |
| Total Sale Value Excluding ST | MRP Value − Discount Value |
| Sale Price per Product | Total Sale Value Excluding ST ÷ Quantity |
| Sales Tax Value | Total Sale Value Excl. ST × Sales Tax % ÷ 100 |
| Advance Tax Value | Total Sale Value Excl. ST × Advance Tax % ÷ 100 |
| Further Tax Value | Total Sale Value Excl. ST × Further Tax % ÷ 100 |

Worked example from the specification: MRP 1,500 × qty 10 = 15,000, less 3,000 discount = 12,000 excl. ST, so Sale Price per Product = 1,200.

**Button OFF — normal mode.** Those three fields hide and the line is priced from unit price upwards:

| Field | Source |
|---|---|
| Sale Price per Product | manually entered |
| Total Sale Value Excluding ST | Sale Price per Product × Quantity |
| Sales Tax / Advance Tax / Further Tax Value | Total Sale Value Excl. ST × respective % ÷ 100 |

---

## 2. What the system does today

Code references are to `src/pages/SalesInvoice.tsx` unless stated.

| Concern | Current behaviour |
|---|---|
| Line fields | 19 fields on one always-visible panel; no modes, no toggle |
| Total Sale Value Excl. ST | **Entered by hand** (`valueSalesExclST`, line 2617). Not derived from anything. |
| Sale Price per Product | **Does not exist.** No per-unit price field on the line. |
| MRP | `Fixed / notified value or Retail Price` (`fixedNotifiedValue`, line 2641) — a single value, not a per-item price, and no derived total |
| Discount | **No field.** Hardcoded `discount: 0` in the FBR payload (line 1773) and in the save payload, despite `InvoiceItems.Discount` existing in the schema (`setup100526.sql:536`) |
| Sales Tax % | `rate` is a **string** such as `"18%"` (line 2584), parsed with a regex at line 1388. FBR requires the string form. |
| Sales Tax Value | Auto: `valueSalesExclST × rate% ÷ 100` (line 1391) |
| Advance Tax Value | Auto: **`(valueSalesExclST + salesTax) × advanceTaxRate ÷ 100`** (lines 1399-1403) — based on the **tax-inclusive** amount |
| Further Tax | A manually entered **value** (`furtherTax`, line 2706). **No percentage field exists.** |
| Extra Tax, ST Withheld at Source, Total Value (FPAD) | Present on the form, sent to FBR (lines 1764-1770) |

---

## 3. Gap analysis

| Mockup field | Status | Action |
|---|---|---|
| HS Code | exists | none |
| Product Description | exists | none |
| Sub Description | exists (shipped 2026-10-26) | none |
| UoM, Qty | exists | none |
| **MRP per Item** | **new** | add; decide relationship to `fixedNotifiedValue` (§5.4) |
| **MRP Value** | **new** | add, derived |
| **Discount Value** | **new** | add, and wire the existing `Discount` column through |
| **Sale Price per Product** | **new** | add; becomes the manual input in OFF mode |
| Total Sale Value Excl. ST | exists, but **manual today** | becomes derived in **both** modes |
| Sales Tax % | exists as string `rate` | reconcile with numeric input (§5.5) |
| Sales Tax Value | exists | formula unchanged |
| Advance Tax % / Value | exists | **base changes** (§5.1) |
| **Further Tax %** | **new** | add; Further Tax Value becomes derived |
| SRO / Schedule, Item Serial | exists | none |
| *Extra Tax* | **on form today, absent from mockups** | §5.2 |
| *ST Withheld at Source* | **on form today, absent from mockups** | §5.2 |
| *Total Value of Sales (FPAD)* | **on form today, absent from mockups** | §5.2 |

---

## 4. Conflicts and risks

Ordered by blast radius.

### 5.1 — BLOCKER: the Advance Tax base changes

Today Advance Tax is calculated on the **tax-inclusive** amount:

```
advanceTaxValue = (valueSalesExclST + salesTax) × advanceTaxRate / 100   // lines 1399-1403
```

The requirement specifies the **tax-exclusive** amount:

```
Advance Tax Value = Total Sale Value Excluding ST × Advance Tax % ÷ 100
```

On an 18% line these differ by 18%. This is a change to a tax figure that is submitted to FBR, so it cannot be made silently. It is also not scoped to MRP mode — the requirement states it for both modes, so it would alter every line, including the behaviour users rely on today.

**Needs a decision.** Options: adopt the new base everywhere; adopt it only in MRP mode (inconsistent but contained); or keep the current base and treat the requirement's formula as an error.

### 5.2 — BLOCKER: three FBR fields disappear from the mockups

`Extra Tax`, `Sales Tax Withheld at Source`, and `Total Value of Sales (in case of FPAD only)` appear on the form today and are sent to FBR (lines 1764-1770). None appears in either mockup, and the field counts quoted (15 ON / 12 OFF) confirm they are not merely cropped.

Removing them would stop those values reaching FBR. For FPAD invoices and withholding scenarios that is a compliance regression, not a cosmetic one.

**Needs a decision.** Options: keep them on the form (mockups treated as indicative, not exhaustive); move them behind an "advanced" disclosure; or genuinely remove them and always send zero.

### 5.3 — Specification contradicts itself on two fields

| Field | Mockup | Formula table |
|---|---|---|
| Discount Value | placeholder reads *(Auto-calculate)* | "Manually entered discount amount" |
| Sale Price per Product (ON) | plain required input, no auto hint | "Total Sale Value Excluding ST ÷ Quantity" |

**Assumption taken**: the formula table wins. Discount Value is a manual input; Sale Price per Product is read-only and derived while the toggle is ON. Both are trivial to flip if wrong.

### 5.4 — MRP per Item vs. the existing Fixed/Notified Value

FBR's payload carries `fixedNotifiedValueOrRetailPrice`, populated today from the `Fixed / notified value or Retail Price` field. The mockup introduces *two* retail-price fields (per item, and value) and drops the existing one.

The natural mapping is `fixedNotifiedValueOrRetailPrice ← MRP Value`, with MRP per Item as a new input that exists only to derive it. That keeps the FBR contract intact. It does mean the existing field is repurposed rather than removed, and any invoice saved before the change keeps whatever was typed there.

### 5.5 — Sales Tax % is a string today

The mockup shows `Sales Tax % *` as a numeric input defaulting to `0`. The system stores `rate` as a string (`"18%"`), auto-filled from the item master and sent to FBR in that form. Changing it to a number would change the FBR payload type — explicitly out of bounds under the project's FBR rules.

**Recommendation**: keep `rate` as the string it is, and parse it for the arithmetic exactly as the code already does. No visible change to the user.

### 5.6 — Total Sale Value Excl. ST becomes read-only in both modes

Today it is typed directly. Under the requirement it is always derived. Anyone entering invoices by typing the line total will find that field locked. The requirement describes this as "the existing calculation remains unchanged", which is inaccurate — there is no such calculation today.

Low technical risk, but it is a workflow change for every user and should be announced rather than discovered.

### 5.7 — Persistence gaps

| Value | Column today |
|---|---|
| Discount Value | `InvoiceItems.Discount` exists, currently always 0 |
| MRP Value | `FixedNotifiedValueOrRetailPrice` (if §5.4 is accepted) |
| **MRP per Item** | **none** |
| **Further Tax %** | **none** (only the value is stored) |
| **Toggle state per line** | **none** |

The toggle state matters: without it, reopening a saved invoice cannot tell whether a line was priced from MRP or from unit price, so the panel cannot restore the right mode. Either store it, or infer it from "MRP per Item is non-zero" — inference is cheaper but wrong for a line whose MRP legitimately is zero.

A migration is required for MRP per Item, Further Tax %, and the mode flag, in the same guarded, rerunnable style as `add_sub_description_to_invoice_items.sql`.

### 5.8 — Stock validation unaffected, but worth stating

Stock is derived by matching invoice lines to catalogue products on HS Code and product name. Nothing in this change touches `ProductDescription`, so the invariant guarded by `src/utils/invoiceDescription.invariant.test.ts` holds. No action needed — recorded so the next person does not have to re-derive it.

---

## 5. Proposed implementation

Once §5.1 and §5.2 are decided:

1. **Migration** — `backend/database/add_mrp_fields_to_invoice_items.sql`: `MrpPerItem DECIMAL(18,2) NULL`, `FurtherTaxRate DECIMAL(5,2) NULL`, `IsMrpMode BIT NOT NULL DEFAULT 0`. Guarded, rerunnable, no backfill.
2. **Calculation module** — `src/utils/invoiceLineCalculations.ts`, holding both modes as pure functions with the tax base as a single named constant. Unit-tested against the worked example (1,500 × 10 − 3,000 = 12,000 → 1,200) and the zero-quantity edge case.
3. **Form** — toggle in the Item Detail header; the three MRP fields rendered conditionally; derived fields read-only with the existing `(Auto-calculate)` affordance.
4. **Persistence** — new columns through the `sys.columns` probe pattern already used for `SubDescription`, so the API keeps working against a database where the migration has not run.
5. **Payload** — `discount` stops being hardcoded; `fixedNotifiedValueOrRetailPrice` carries MRP Value in MRP mode.

**Division by zero**: Sale Price per Product = Total ÷ Quantity is undefined at quantity 0, which is the default for a new line. It must render blank, not `NaN` or `Infinity`.

---

## 6. Decisions taken

Both blockers were settled on 2026-11-18.

**1 — Advance Tax base: exclusive in MRP mode only.** MRP-mode lines charge Advance Tax on Total Sale Value Excluding ST, per the requirement. Normal-mode lines keep the tax-inclusive base the system has always used, so nothing about existing invoicing changes.

> **Deviation worth recording.** The supplied formula table lists the exclusive base for *normal* mode too. That half was not adopted, by explicit decision, because it would have changed the advance tax figure on every line already in use. The result is two advance tax rules on one invoice — contained, but it needs to be understood by whoever reads the figures. The split lives in one named constant, `ADVANCE_TAX_BASE` in `src/utils/invoiceLineCalculations.ts`, so reversing it is a one-line change.

**2 — Extra Tax, ST Withheld at Source, Total Value (FPAD): kept on the form.** The mockups are treated as showing the pricing fields, not the complete form. All three stay visible and keep reaching FBR, so there is no compliance regression. The delivered form therefore has more fields than the mockup shows.

---

## 7. Test plan

| Case | Expected |
|---|---|
| Worked example: MRP 1,500, qty 10, discount 3,000 | Total 12,000; Sale Price per Product 1,200 |
| Toggle ON → OFF with values entered | MRP fields hide; Total recomputes from Sale Price × Qty |
| Toggle OFF → ON | Three fields appear; Total recomputes from MRP Value − Discount |
| Quantity 0 in MRP mode | Sale Price per Product blank, no `NaN` |
| Discount greater than MRP Value | Negative total blocked or warned — **behaviour not specified, needs a ruling** |
| Save, reopen | Line returns in the mode it was saved in, with all values intact |
| Invoice created before this change | Opens in OFF mode, values unchanged |
| Submit to FBR | `discount` carries the real value; `fixedNotifiedValueOrRetailPrice` carries MRP Value |
| Stock after saving an MRP-mode line | Moves by the invoiced quantity, exactly as before |


---

## 8. Implementation record

Built 2026-11-18. Typecheck clean, production build compiles, 48 tests pass.

| File | Change |
|---|---|
| `src/utils/invoiceLineCalculations.ts` | **New.** Both pricing modes as pure functions. `ADVANCE_TAX_BASE` holds the split from §6. Division by zero returns 0 rather than `NaN`. |
| `src/utils/invoiceLineCalculations.test.ts` | **New.** 20 tests, including the requirement's worked example (1,500 × 10 − 3,000 = 12,000 → 1,200) and a test asserting the two modes differ *only* in the advance tax base. |
| `backend/database/add_mrp_fields_to_invoice_items.sql` | **New.** Adds `IsMrpMode`, `MrpPerItem`, `SalePricePerProduct`, `FurtherTaxRate`. Guarded, rerunnable, no backfill. |
| `src/pages/SalesInvoice.tsx` | Toggle in the Item Detail header; three MRP fields rendered conditionally; Sale Price per Product and Further Tax % added; Total Excl. ST, Sale Price (MRP mode) and Further Tax Value made read-only; all pricing routed through the calculation module. |
| `backend/server.js` | New columns threaded through four `sys.columns` probes, four SELECT lists, both read mappers and both insert paths, using the existing degrade-gracefully pattern. |

**Discount stops being a lie.** `discount: 0` was hardcoded in both the FBR payload and the preview payload. It now carries the entered value. `InvoiceItems.Discount` has existed since the original schema and was never populated.

**MRP Value maps to `fixedNotifiedValueOrRetailPrice`** while the toggle is on, keeping the FBR contract intact (§5.4).

### Still to do

1. Apply `backend/database/add_mrp_fields_to_invoice_items.sql`. Until then the API degrades gracefully — lines save, but MRP detail is dropped and every line reopens in normal mode.
2. Walk the test plan in §7 in a browser. None of it has been exercised against a running app.
3. Rule on a discount larger than the MRP value. The form flags it and the total goes negative; it is not blocked, because the correct behaviour was never specified.

---

## 9. Template 5 — the printed sheet for MRP users

Added 2026-11-18, after the form work above.

Template 2 has no column for a retail price, so an MRP-priced line printed on it
showed only the derived unit price and the net exclusive value — the retail price
the buyer recognises and the discount they were given were both invisible.
Template 5 is Template 2 with those figures restored.

### What changed

| File | Change |
|---|---|
| `src/components/SalesInvoiceReport.tsx` | **New `TemplateFive`.** Template 2's sheet with three added line columns, and `template5` added to the dispatcher. |
| `src/components/SalesInvoiceReport.totals.test.ts` | **New.** 11 tests over the footer arithmetic for both pricing modes and for an invoice that mixes them. |
| `src/types/index.ts` | `template5` added to the `salesInvoiceTemplate` union; `isMrpMode`, `mrpPerItem`, `salePricePerProduct` and `furtherTaxRate` added to `InvoiceItem`. |
| `src/pages/CompanyManagement.tsx` | Template 5 added to the picker, labelled "Template 2 with MRP columns". |
| `src/pages/SalesInvoice.tsx` | `prepareInvoiceData` now passes `isMrpMode`, `mrpPerItem` and `salePricePerProduct` through to the preview, so the unsaved invoice prints the same as the saved one. |

No migration. `Companies.SalesInvoiceTemplate` is `NVARCHAR(50)` with no check
constraint, so the new value stores as it stands.

### The line table

Twelve columns instead of nine: **M.R.P. Per Item**, **M.R.P. Value** and
**Discount** sit between Description and Unit Price. The table type drops from
1.00rem to 0.78rem to keep the same A4 width.

A line priced as unit price × quantity prints `-` in all three, so an invoice
that mixes the two modes still reads correctly. The totals row carries the MRP
value and discount totals only when at least one line is in MRP mode, and the
right-hand summary gains `M.R.P. VALUE` and `LESS DISCOUNT` rows above
`INCL AMOUNT` on the same condition — those three figures foot:
MRP value − discount = the exclusive subtotal.

Unit Price prefers the stored `salePricePerProduct` on an MRP line and falls back
to value ÷ quantity, which is what it has always been elsewhere.

### Advance tax rate on the sheet

Template 2 derives the printed `@ x%` by dividing total advance tax by the
tax-**inclusive** amount. Per §6 an MRP line is charged on the tax-**exclusive**
total, so that division would understate the rate on an MRP invoice — the worked
example charges 0.5% (60 on 12,000) and Template 2 would print `@ 0.4%`, because
60 ÷ 14,160 is 0.42%. Template 5 derives the rate
against the sum of each line's own base. Template 2 is untouched, and stays
correct for the normal-mode lines it serves.

### A double deduction, fixed

Templates 1 and 4 subtract `item.discount` from their totals. That was harmless
while `discount` was hardcoded to 0 (§8) and became a real defect the moment MRP
mode began populating it: an MRP line's discount is already inside
`valueSalesExcludingST`, so those sheets deducted it twice — 3,000 off the
worked example's total, twice.

`calculateTotals` now reports two figures. `totalDiscount` is the discount still
to come off the total, which is 0 for an MRP line; every existing arithmetic
ladder uses it and keeps footing. `discountGiven` is the discount granted across
all lines, which only Template 5 prints. Template 1's per-line total was fixed
the same way. This corrects Templates 1 and 4 for MRP invoices; neither sheet
changes for a normal-mode invoice.

### Conflicts and limits

- **The requirement never specified a printed layout.** The column set, their
  order and the summary rows are inferences from the Item Detail field list. If
  the intended sheet differs, the layout is the part to change — the arithmetic
  is tested separately.
- **Twelve columns on A4 portrait is tight.** 0.78rem type fits the worked
  example, but a long product description plus a long HS code will wrap more than
  on Template 2. Description was cut from 24.4% to 18.0% of the table to make
  room.
- **Template 5 has not been printed.** No database here, so nothing below has
  been checked against a rendered sheet: that 12 columns fit inside the A4 margin,
  that the header and totals rows still align, or that the blank-row filler keeps
  the sheet at one page.
- **A pre-migration invoice prints as normal mode.** Correct — that is how it was
  entered — but an invoice saved in MRP mode *before* the migration is applied
  also prints as normal mode, with the discount lost. §8 item 1 still applies.
