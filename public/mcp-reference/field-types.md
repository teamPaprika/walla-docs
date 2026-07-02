# Walla field types

The catalog of field types you encounter in `get_form` / `get_published_form` output and must produce when authoring fields — each type's properties shape, options model, validations, and answer shape.

## How to read this

A form is a tree of **fields**. Every field carries a stable `id`, a `label`, a `fieldType` (one of 31 values below), an optional `branches` array (skip logic), a `properties` object (type-specific config), a `validation` object (answer constraints), and an `outputSchema` (the shape a submitted answer must match). For the form/field object model and discovery chain (`list_teams` → `list_workspaces` → `list_forms` → `get_form` / `get_published_form`) and the error contract, see the server instructions. For branch logic, see `walla://reference/branch-logic`. For the `CUSTOM` iframe field, see `walla://reference/custom-fields`.

## The option `id` / `value` / `label` rule (read this first)

Choice and grid fields carry options. **Each option is `{ id, label, value }` and the three strings are consumed by different subsystems — never interchange them:**

| Option field | Who uses it | Rule |
|---|---|---|
| **`id`** | The dynamic `outputSchema` and branch authoring | The `outputSchema` enumerates option **ids**, and a branch condition is authored referencing option **ids**. The `id` is opaque, ~9 chars `[A-Za-z]`, and **never changes** when a label is edited. It is the stable anchor for branch logic. |
| **`value`** | The stored answer and branch comparison | A submitted/stored answer holds option **values**. Branch logic resolves each authored id to its `value` before comparing. By default `value` equals `label`. |
| **`label`** | Display | The visible text shown to a respondent. Ids and values are never shown. |

> **One-line rule:** the `outputSchema` enumerates `id`; the stored answer holds `value`; branch logic is authored on `id` but compares `value`; the UI shows `label` — and `value` defaults to `label`, while `id` is the only part that never changes.
>
> Practical consequence: renaming a `label` changes the `value` (and therefore the stored answer text and what a branch operand matches) but does **not** change the `id`, so branches stay stable because they anchor on `id`. On `add_field` the server mints option `id`s — you supply none (use a `key` to reference a new option in same-batch logic); only when adding an option via `update_field` do you assign a fresh unique `id` (never a reused one). (Adding an option forces its `value` to equal its `label` — a custom `value` supplied on add is discarded; to store a `value` distinct from `label`, set it when **updating** the field via `form_apply_edits`, which preserves a supplied `value`. The system default is `value === label`.)

## The 31 types and 9 groups

```jsonc
// fieldType — one of:
"SHORT_TEXT","LONG_TEXT","NUMBER","CHECKBOX","RADIO",
"PICTURE_CHOICE","DROPDOWN","DROPDOWN_MULTI","LINEAR","CHECKBOX_GRID",
"RADIO_GRID","DATE","TIME","DESCRIPTION","GEOLOCATION",
"TABLE","PRIVACY_POLICY_INFORMATION","EMAIL","PHONE_NUMBER","WEBSITE_LINK",
"IMAGE_UPLOAD","VIDEO_UPLOAD","FILE_UPLOAD","ADDRESS","TOSS_PAYMENTS",
"SECRETS","CUSTOM","SUBMIT","REJECT","ENDING_REDIRECT","ENDING_DESCRIPTION"

// group — one of:
"CHOICES","TEXT","CONTACTS","FORM_STRUCTURE","DATA",
"ENDING","DATE_TIME","PAYMENTS","ACTION"
```

| Group | Types |
|---|---|
| **CHOICES** | `CHECKBOX`, `RADIO`, `PICTURE_CHOICE`, `DROPDOWN`, `DROPDOWN_MULTI`, `LINEAR`, `CHECKBOX_GRID`, `RADIO_GRID`, `PRIVACY_POLICY_INFORMATION` |
| **TEXT** | `SHORT_TEXT`, `LONG_TEXT`, `NUMBER`, `TABLE`, `SECRETS` |
| **CONTACTS** | `EMAIL`, `PHONE_NUMBER`, `ADDRESS` |
| **FORM_STRUCTURE** | `DESCRIPTION`, `WEBSITE_LINK` |
| **DATA** | `GEOLOCATION`, `IMAGE_UPLOAD`, `VIDEO_UPLOAD`, `FILE_UPLOAD` |
| **DATE_TIME** | `DATE`, `TIME` |
| **PAYMENTS** | `TOSS_PAYMENTS` |
| **ENDING** | `ENDING_REDIRECT`, `ENDING_DESCRIPTION` |
| **ACTION** | `CUSTOM`, `REJECT` (and `SUBMIT`, which has no group) |

> `SUBMIT` is special: it has no group, no `properties` schema, and a null answer. Do not assume all 31 types appear in a properties/group map — `SUBMIT` is absent from both.

## Options model

### Choice options

```jsonc
// One option (RADIO, CHECKBOX, DROPDOWN, DROPDOWN_MULTI, LINEAR, PRIVACY_POLICY_INFORMATION)
{ "id": "aBcDeFgHi", "label": "Yes", "value": "Yes" }

// properties.options is an array of these. Optional behavior flags:
{ "options": [ /* … */ ], "shuffle": true, "hasCustomInput": true }
```

`PICTURE_CHOICE` options add an `imageUrl`, and its properties add `imageHeight`, `multiSelect`, `isSingleLineOnMobile`:

```jsonc
{
  "options": [ { "id": "…", "label": "Cat", "value": "Cat", "imageUrl": "https://…" } ],
  "imageHeight": 120,        // default 120; editor clamps 50–500
  "multiSelect": false,
  "isSingleLineOnMobile": false
}
```

`LINEAR` is a numeric scale whose points are materialized as options (each `label` and `value` is the stringified number). This is the shape you **read** back:

```jsonc
{
  "min": 1, "max": 5, "minLabel": "", "maxLabel": "",
  "options": [
    { "id": "…", "label": "1", "value": "1" },
    { "id": "…", "label": "2", "value": "2" }
    // … through max
  ]
}
```

**When you AUTHOR a `LINEAR` field with `form_apply_edits`, supply `min`/`max`/`minLabel`/`maxLabel` only — the scale points (`options`) are derived from `min`/`max` for you, exactly as the editor does. Supplying an `options` array is rejected with `invalid_args`.** `min` and `max` must be integers with `min < max`; the option count is always `max − min + 1`. To change a scale, `update_field` with the new `min`/`max` and the points are re-derived.

### Grid rows vs columns (the key asymmetry)

`CHECKBOX_GRID`, `RADIO_GRID`, and `TABLE` use a grid model. **Columns are the selectable axis and carry the full `{id,label,value}`; rows are scoping (one sub-answer each) and carry only `{id,label}` — rows have no `value`.**

```jsonc
{
  "rows":    [ { "id": "r1", "label": "Speed" }, { "id": "r2", "label": "Price" } ],
  "columns": [ { "id": "c1", "label": "Good", "value": "Good" },
               { "id": "c2", "label": "Bad",  "value": "Bad" } ],
  "shuffleRows": false,
  "shuffleColumns": false,
  "isDuplicateColumnLimited": false   // RADIO_GRID only: each column usable in at most one row (ranking matrix)
}
```

**Ranking questions** — Walla has no dedicated ranking field type; build one from a `RADIO_GRID`: **rows = the items to rank, columns = the rank positions** (`1st`, `2nd`, `3rd`, …). Because it is radio, each row (item) takes exactly one column (rank). To make each rank usable only once (no two items sharing a rank), set `isDuplicateColumnLimited: true`; left `false`, two items may land on the same rank. This yields an "assign each item a distinct rank" matrix, not a drag-to-reorder UI.

## Properties shape per type

Types not listed have **no properties object** (omit `properties` or send `{}`): `DATE`, `TIME`, `GEOLOCATION`, `ADDRESS`, `DESCRIPTION`, `IMAGE_UPLOAD`, `VIDEO_UPLOAD`, `REJECT`, `ENDING_DESCRIPTION`, `SUBMIT`. (`CUSTOM` takes properties too, but their shape is defined by the extension version's own schema, not this catalog — see `walla://reference/custom-fields`.)

| Properties shape | Types | Defaults / fields |
|---|---|---|
| `{ placeholder? }` | `SHORT_TEXT`, `LONG_TEXT`, `NUMBER`, `EMAIL` | `placeholder: ""` |
| `{ options[], shuffle?, hasCustomInput? }` | `RADIO`, `CHECKBOX` | starts with one blank option |
| `{ options[] }` | `DROPDOWN`, `DROPDOWN_MULTI`, `PRIVACY_POLICY_INFORMATION` | dropdowns have no `shuffle`; privacy default = two options `동의합니다` / `동의하지 않습니다` |
| `{ options[], imageHeight?, multiSelect?, isSingleLineOnMobile?, shuffle? }` | `PICTURE_CHOICE` | `imageHeight: 120` |
| `{ options[], min, max, minLabel, maxLabel }` | `LINEAR` | scale 1..5; **author `min`/`max`/`minLabel`/`maxLabel` only — `options` are derived from `min`/`max`, not supplied** |
| `{ rows[], columns[], shuffleRows?, shuffleColumns?, isDuplicateColumnLimited? }` | `CHECKBOX_GRID`, `RADIO_GRID`, `TABLE` | one blank row + one blank column |
| `{ defaultCountry? }` | `PHONE_NUMBER` | — |
| `{ placeholder?, allowPaste?, requireConfirmation? }` | `SECRETS` | `allowPaste: true`, `requireConfirmation: false` |
| `{ link? }` | `WEBSITE_LINK` | created empty unless you set `link` |
| `{ isFileVolumeLimited?, fileVolumeLimit? }` | `FILE_UPLOAD` | `isFileVolumeLimited: false`, `fileVolumeLimit: 15` |
| `{ redirectUrl }` | `ENDING_REDIRECT` | `redirectUrl: ""` |
| `{ workspaceSecretDataId, variantKey, orderIdPrefix, orderName, amount }` | `TOSS_PAYMENTS` | all required |

> `shuffleRows` / `shuffleColumns` exist on the grid shape but are not honored at fill time — only `shuffle` on `RADIO`, `CHECKBOX`, `PICTURE_CHOICE` actually randomizes order.

## Validations per type

A field's `validation` object can carry these kinds. **`basic` is the only one enforced on the server alongside `quota`; `string` / `numeric` / `array` are checked at fill time only; `custom` / `remote` are accepted but never enforced (do not rely on them).**

| Kind | Shape | Meaning |
|---|---|---|
| `basic` | `{ isRequired: boolean }` | Required toggle (default `false`). |
| `string` | `{ includes?, excludes?, pattern?, length?: { minLength?, maxLength? } }` | Text constraints. |
| `numeric` | `{ min?, max? }` | Numeric range (the answer is a string, compared numerically). |
| `array` | `{ min?, max?, exact?, includes?, excludes? }` | Selection-count / required-value constraints for multi-select. |
| `quota` | `{ config: { [optionId]: number \| null } \| null }` | Per-option response cap (`null` = uncapped). **Server-enforced.** |

Which kinds each type accepts:

| Type | basic | string | numeric | array | quota |
|---|:-:|:-:|:-:|:-:|:-:|
| `SHORT_TEXT`, `LONG_TEXT` | ✅ | ✅ | | | |
| `EMAIL`, `PHONE_NUMBER`, `SECRETS` | ✅ | ✅ | | | |
| `NUMBER` | ✅ | | ✅ | | |
| `CHECKBOX`, `RADIO`, `DROPDOWN`, `DROPDOWN_MULTI`, `PICTURE_CHOICE` | ✅ | | | ✅ | ✅ |
| `LINEAR`, `PRIVACY_POLICY_INFORMATION` | ✅ | | | ✅ | |
| `CHECKBOX_GRID`, `RADIO_GRID`, `TABLE` | ✅ | | | | |
| `DATE`, `TIME`, `GEOLOCATION`, `ADDRESS` | ✅ | | | | |
| `IMAGE_UPLOAD`, `VIDEO_UPLOAD`, `FILE_UPLOAD` | ✅ | | | | |
| `TOSS_PAYMENTS`, `CUSTOM` | ✅ | | | | |
| `DESCRIPTION`, `WEBSITE_LINK`, `SUBMIT`, `REJECT`, `ENDING_REDIRECT`, `ENDING_DESCRIPTION` | | | | | |

Notes you will get wrong otherwise:
- **`quota` is only valid on `RADIO`, `CHECKBOX`, `DROPDOWN`, `DROPDOWN_MULTI`, `PICTURE_CHOICE`.** `LINEAR` and `PRIVACY_POLICY_INFORMATION` have options but are **not** quota-eligible.
- `quota.config` keys are option **ids**. Over-cap submissions are rejected server-side; a busy form may transiently reject with a retryable error.
- The six bottom-row types take no validation at all.

## Answer (output) shape per type

A submitted answer must validate against the field's `outputSchema`. For choice fields the schema is **option-aware**: the dynamic schema enumerates the option **ids**, while the **stored answer value is the option's `value`** (which defaults to `label`). These are two different artifacts — the schema is keyed on `id`, the persisted answer holds `value` — and for choice fields they intentionally differ.

| Type(s) | Stored answer | Notes |
|---|---|---|
| `SHORT_TEXT`, `LONG_TEXT`, `NUMBER`, `DATE`, `TIME`, `EMAIL`, `PHONE_NUMBER`, `ADDRESS`, `SECRETS`, `IMAGE_UPLOAD`, `VIDEO_UPLOAD`, `FILE_UPLOAD` | `string` | `NUMBER` is stored as a string. |
| `RADIO`, `DROPDOWN`, `LINEAR`, `PRIVACY_POLICY_INFORMATION` | `string[]` (length ≤ 1) | array of option **values**. |
| `CHECKBOX`, `DROPDOWN_MULTI`, `PICTURE_CHOICE` | `string[]` | array of option **values**. |
| `CHECKBOX_GRID`, `RADIO_GRID` | `{ [rowId]: string[] }` | each row maps to selected **column values** (≤1 for RADIO_GRID). |
| `TABLE` | `{ [rowId]: { [colId]: string } }` | free-text cell per row×column (not a column selection). |
| `GEOLOCATION` | `{ latitude: string, longitude: string }` | |
| `TOSS_PAYMENTS` | `{ status, orderId, amount, message?, code? }` | `status` ∈ `request_success`, `request_fail`, `confirm_fail`, `confirm_cancel`, `confirm_cancel_fail`. |
| `CUSTOM` | per the custom field's own schema | see `walla://reference/custom-fields`. |
| `DESCRIPTION`, `WEBSITE_LINK`, `SUBMIT`, `REJECT`, `ENDING_REDIRECT`, `ENDING_DESCRIPTION` | `null` (no input) | structural / display / terminal. |

Worked example — a `RADIO` field and a matching submitted answer:

```jsonc
// Field
{
  "id": "fld_color",
  "fieldType": "RADIO",
  "label": "Pick a color",
  "validation": { "basic": { "isRequired": true } },
  "properties": {
    "options": [
      { "id": "optRed",  "label": "Red",  "value": "Red" },
      { "id": "optBlue", "label": "Blue", "value": "Blue" }
    ]
  }
}
// The field's outputSchema enumerates option ids ("optRed","optBlue"),
// but the stored/submitted answer holds the option's VALUE — here "Red",
// because value defaults to label:
"fld_color": ["Red"]
```

## Master matrix

| Type | Group | Has options | Validations (quota = server) | Answer shape |
|---|---|:-:|---|---|
| `SHORT_TEXT` | TEXT | no | basic, string | string |
| `LONG_TEXT` | TEXT | no | basic, string | string |
| `NUMBER` | TEXT | no | basic, numeric | string |
| `CHECKBOX` | CHOICES | yes | basic, array, **quota** | value[] |
| `RADIO` | CHOICES | yes | basic, array, **quota** | value[] (≤1) |
| `PICTURE_CHOICE` | CHOICES | yes (+image) | basic, array, **quota** | value[] |
| `DROPDOWN` | CHOICES | yes | basic, array, **quota** | value[] (≤1) |
| `DROPDOWN_MULTI` | CHOICES | yes | basic, array, **quota** | value[] |
| `LINEAR` | CHOICES | yes (auto) | basic, array | value[] (≤1) |
| `CHECKBOX_GRID` | CHOICES | rows+cols | basic | `{rowId: value[]}` |
| `RADIO_GRID` | CHOICES | rows+cols | basic | `{rowId: value[]}` (≤1/row) |
| `DATE` | DATE_TIME | no | basic | string |
| `TIME` | DATE_TIME | no | basic | string |
| `DESCRIPTION` | FORM_STRUCTURE | no | — | null |
| `GEOLOCATION` | DATA | no | basic | `{latitude, longitude}` |
| `TABLE` | TEXT | rows+cols | basic | `{rowId: {colId: string}}` |
| `PRIVACY_POLICY_INFORMATION` | CHOICES | yes | basic, array | value[] |
| `EMAIL` | CONTACTS | no | basic, string | string |
| `PHONE_NUMBER` | CONTACTS | no | basic, string | string |
| `WEBSITE_LINK` | FORM_STRUCTURE | no | — | null |
| `IMAGE_UPLOAD` | DATA | no | basic | string |
| `VIDEO_UPLOAD` | DATA | no | basic | string |
| `FILE_UPLOAD` | DATA | no | basic | string |
| `ADDRESS` | CONTACTS | no | basic | string |
| `TOSS_PAYMENTS` | PAYMENTS | no | basic | `{status, orderId, amount, …}` |
| `SECRETS` | TEXT | no | basic, string | string |
| `CUSTOM` | ACTION | per field | basic | per custom field |
| `SUBMIT` | (none) | no | — | null |
| `REJECT` | ACTION | no | — | null |
| `ENDING_REDIRECT` | ENDING | no | — | null (`redirectUrl` in properties) |
| `ENDING_DESCRIPTION` | ENDING | no | — | null |

## Gotchas

- **The stored answer holds `value`, the `outputSchema` enumerates `id`, branch logic is authored on `id` but compares `value`, and the UI shows `label`.** `value` defaults to `label`; `id` never changes. Editing a label changes the value (and therefore the stored answer text and any branch match resolved from it) but keeps branches stable because they anchor on `id`.
- **`LINEAR` and `TABLE` break the "answer is an option `value`" pattern** but you still read them via the answer shapes above: a `LINEAR` answer is the stringified scale number (e.g. `"3"`), and `TABLE` answers are free text keyed by row×column.
- **Grid rows have no `value`** — only columns carry the `{id,label,value}` triple. A grid answer maps each `rowId` to the selected column **values**.
- **`quota` keys on option `id`** and is the one validation enforced for everyone at submit time; required-ness (`basic.isRequired`) is enforced at fill time. `string` / `numeric` / `array` / `custom` / `remote` are not re-checked server-side — never assume a stored answer passed them.
- **`WEBSITE_LINK` accepts a `{ link? }` properties shape but is created empty** — set `link` explicitly.
- **`SUBMIT` has no group and no properties schema**; its only setting is an optional button label. Do not synthesize a `properties` object for it, and note `SUBMIT` cannot be added or deleted through `form_apply_edits` (it is a system field).
- **`REJECT` is a screen-out / disqualification step.** When a respondent reaches it the form ends immediately as *rejected* (its `descriptionHtml` is the disqualification message shown to them) — **distinct from `ENDING_*`**, which are post-submission thank-you / redirect screens shown only after a **successful** submission. To screen someone out, add a `REJECT` field and route to it with `set_field_logic` (`goTo { field: <rejectId> }`); do **not** use an ending for disqualification.
