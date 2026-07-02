# Walla form structure

The JSON layout of a form as returned by the read tools — the page/group ordering, the per-field object, and hidden fields — so you can read a form and produce valid content for the `form_apply_edits` tool.

When you call a read tool, you get back a form object. Its `formFieldsOrder` describes the page/screen layout, a separate field list carries every field's full body, and `hiddenFields` lists prefill parameters. This reference covers each of those. For the discovery chain (`list_teams` → `list_workspaces` → `list_forms` → `get_form` / `get_published_form`) and the error contract, see the server instructions.

Sibling references:
- Per-field-type `properties` shapes and defaults: `walla://reference/field-types`
- Conditional jump logic on a field's `branches`: `walla://reference/branch-logic`
- A field's rich-text description: `walla://reference/field-descriptions`

---

## Top-level shape

```jsonc
{
  "id": "form_abc123",
  "title": "Customer survey",
  "formFieldsOrder": { /* layout: groups + submit + optional ending — see below */ },
  "hiddenFields": [ { "id": "utm_source", "label": "Source" } ],
  "fields": [ /* one object per field — see "The field object" */ ],
  "groups": [ /* friendly page/group view derived from formFieldsOrder — see "Pages and groups" */ ]
  // ...plus presentation/metadata keys (colorPalette, pageTransitionSetting, badge, brandLogoUrl, timestamps)
}
```

Two structures define the content you care about:

| Key | What it is |
|---|---|
| `formFieldsOrder` | The ordered grouping of field **ids** that defines page/screen layout and field sequence. The skeleton. |
| `fields` (field list) | One object per field. From `get_form` this is a **lean read projection** (`id`, `label`, `fieldType`, `properties`, `validations`, plus `outputType` and friendly `logic` when present; CUSTOM adds its version ids + `outputSchema`) — see "The field object" below. The flesh. |
| `hiddenFields` | URL/prefill parameters carried with a submission (not shown as questions). |

**How they relate:** `formFieldsOrder` only ever holds field **id strings**. To render or reason about a field, take an id from a group's `children` and look it up by `id` in the field list. Every id that appears in `formFieldsOrder` should have a matching field object, and vice versa.

> Form-level settings (response limits, open/close scheduling, duplicate prevention, integrations) are **not** part of this structure. Do not expect or emit them here.

---

## `formFieldsOrder` — the layout

An object with these members:

| Member | Shape | Meaning |
|---|---|---|
| `submit` | `{ "children": string[] }` | The submit/last screen. `children` are field ids shown there. **Always present.** |
| `ending` | `{ "children": string[] }` *(optional)* | Post-submission screens (e.g. redirect / thank-you). `children` are **ending** field ids. May be absent. |
| `group_xxxxx` | `FieldGroup` (see below) | One per page/screen of questions. Any number of these. The **key** must match the pattern `group_` followed by word characters. |

A `FieldGroup` (each `group_xxxxx` value):

```jsonc
{
  "order": 0,                  // render order among groups; a contiguous 0..n sequence
  "chaining": "APPEND",        // "APPEND" | "PRESS_BUTTON" — how fields within the group advance
  "children": ["fld_q1", "fld_q2"],  // ordered field ids in this group
  "label": "Section 1"         // optional editor-only group label
}
```

| Property | Type | Notes |
|---|---|---|
| `order` | number | Position of this group relative to other groups. Groups render low→high. Keep them a contiguous `0..n` run. |
| `chaining` | `"APPEND"` \| `"PRESS_BUTTON"` | Page boundary: `"APPEND"` continues onto the same page as the next group; `"PRESS_BUTTON"` **ends the page** at this group (a page break). New groups conventionally use `"APPEND"`. See "Pages and groups" below. |
| `children` | `string[]` | Ordered field ids belonging to the group. |
| `label` | string *(optional)* | Display label for the group. Older forms omit it. |

### Worked example

```jsonc
{
  "submit": { "children": ["fld_submit"] },
  "ending": { "children": ["fld_thankyou"] },
  "group_a1b2c": {
    "order": 0,
    "chaining": "APPEND",
    "children": ["fld_name", "fld_email"],
    "label": "About you"
  },
  "group_d3e4f": {
    "order": 1,
    "chaining": "PRESS_BUTTON",
    "children": ["fld_rating"]
  }
}
```

Read this as: page 0 ("About you") shows `fld_name` then `fld_email`; page 1 shows `fld_rating`; the submit screen carries `fld_submit`; after submission, `fld_thankyou` is shown. To render the full form in order, sort the `group_*` entries by `order`, walk each group's `children`, then handle `submit`, then `ending`.

### How to read the layout

1. Collect every key starting with `group_`; sort them by their `order`.
2. For each group, iterate `children` in array order, looking each id up in the field list.
3. Render the `submit` group's children, then (if present) the `ending` group's children.

When producing a `formFieldsOrder` (e.g. for the `form_apply_edits` reorder op):
- Always include `submit`.
- Mint new group keys as `group_` + a short unique suffix; ensure they match `group_\w+`.
- Keep `order` values contiguous starting at 0.
- Every id you place in any `children` array must correspond to a field object you also include in the field list.

---

## Pages and groups (the `groups` view + page breaks)

A **page break** is not a separate field type — it is a group's `chaining` property. A **page** is the run of groups (in `order`) up to and including the first group whose `chaining` is `"PRESS_BUTTON"`: `"APPEND"` continues onto the same page as the next group, and `"PRESS_BUTTON"` flushes the page there. (In `SURVEY` render mode each group is its own page and `chaining` does not affect the split; that mode is out of scope here.)

To make these page/group boundaries easy to read and edit, `get_form` exposes a derived **`groups`** array alongside `fields`, normalized from `formFieldsOrder`'s `group_*` entries (sorted by `order`; `submit` / `ending` excluded):

```jsonc
"groups": [
  {
    "groupId": "group_a1b2c",          // the group_* key
    "order": 0,
    "chaining": "APPEND",              // "APPEND" | "PRESS_BUTTON"
    "label": "About you",             // optional editor-only group label
    "fieldIds": ["fld_name", "fld_email"]  // this group's children, in order
  }
]
```

This is the same data as the raw `group_*` entries, just normalized for convenience: `fieldIds` is the group's `children`. To set a page break or a group's label, take a `groupId` from this `groups` view and call `form_apply_edits` with `set_group { groupId, chaining }` (see `walla://reference/editing-contract` §(d)).

---

## Form appearance settings (`colorPalette` / `pageTransitionSetting`)

Two form-level visual settings sit on the form object (passthrough keys), not inside any field:

- **`colorPalette`** — `{ primary, background, foreground?, primaryForeground? }`. `primary` (button color) and `background` (page background) are always-present hex strings; `foreground` / `primaryForeground` (optional text colors) are absent when "auto". Read them from the `form` object returned by `get_form`.
- **`pageTransitionSetting`** — `Partial<{ hideNextButton: boolean; nextButtonLabel: string }>` (or absent). Controls the next-button between pages; `nextButtonLabel` is ≤ 20 chars.

Both are edited with the `set_form_appearance` op (partial-merge; see `walla://reference/editing-contract` §(d)).

---

## The field object

> **`get_form` returns a LEAN projection of this object, not the full stored row.** Each `fields` entry from `get_form` carries only `id`, `label`, `fieldType`, `properties`, `validations`, `outputType` (the stored `outputSchema.type`), and `logic` (the friendly jump-logic shape, present only when the field has branches — the raw `branches` array is NOT returned). CUSTOM fields additionally carry `customFieldTypeId`, `customFieldVersionId`, and the full `outputSchema`. Do not expect `formId`, raw `branches`, `validationErrorMessage`, or masking keys back from `get_form`; `get_published_form` returns its own lightweight list (id, label, type, output type).

A field's full stored/emitted shape — of which `get_form` returns only the lean subset above — is:

```jsonc
{
  "id": "fld_q1",
  "formId": "form_abc123",
  "label": "What is your name?",       // the question text shown to respondents
  "fieldType": "SHORT_TEXT",            // discriminator — see field-types reference
  "validations": { "basic": { "isRequired": true } },
  "validationErrorMessage": { "basic": {} },
  "properties": { "placeholder": "" }, // shape varies by fieldType
  "outputSchema": { "type": "string" },// JSON-Schema of the submitted value
  "branches": [ /* optional jump logic */ ],
  "isResponseMasked": false,            // optional
  "propertiesSchema": { /* optional */ }
}
```

| Property | Type | Required\* | Meaning |
|---|---|---|---|
| `id` | string | yes | Field id. Referenced from `formFieldsOrder` and from branch targets. |
| `formId` | string | yes | Owning form id. |
| `label` | string | yes | The question label shown to respondents. |
| `fieldType` | enum string | yes | Drives `properties`, `outputSchema`, allowed validations, and rendering. See `walla://reference/field-types`. |
| `validations` | object | yes | Validation rules (see below). |
| `validationErrorMessage` | object | yes | Per-rule override message strings. Keys mirror the validation rule names *(except `quota`, which has no error-message counterpart)*; values are strings. |
| `properties` | object | varies | Type-specific configuration. Shape depends entirely on `fieldType`. See `walla://reference/field-types`. |
| `outputSchema` | JSON-Schema object | yes | JSON-Schema describing this field's submitted value. |
| `branches` | array | no | Conditional jump logic. See `walla://reference/branch-logic`. Absent on fields that cannot branch (`REJECT`, `ENDING_DESCRIPTION`, `ENDING_REDIRECT`). |
| `isResponseMasked` | boolean | no | Whether stored responses for this field are masked. |
| `responseMaskOptions` | object | no | `{ "maskingType": ..., "regex"?: ... }` when masking is on. `maskingType` is one of `EMAIL`, `NAME`, `CREDIT_CARD`, `PHONE`, `SSN`, `DRIVER_LICENSE`, `PASSPORT`, `FULL`, `CUSTOM`. |
| `propertiesSchema` | JSON-Schema object | no | JSON-Schema describing the `properties` shape. |
| `isDeleteScheduled` / `deleteAfterPeriod` | boolean / string | no | Scheduled-deletion flag and retention window for this field's responses. |

\* The "Required" column above describes which members you supply when *emitting* a field via `form_apply_edits` — but note the field `id` is assigned by the server, so you never supply it (see `walla://reference/editing-contract` for exactly which keys the tool accepts). When merely reading a form, treat every member as something that may or may not be present.

### `validations`

An object keyed by rule name; every key is optional except `basic`. Only `basic` is required in an emitted `validations` object — omit any rule you do not use rather than passing empty placeholders.

```jsonc
{
  "basic":   { "isRequired": true },          // required-field toggle (default false)
  "string":  { "includes": [], "excludes": [], "pattern": null,
               "length": { "minLength": null, "maxLength": null } },
  "numeric": { "min": null, "max": null },
  "array":   { "min": null, "max": null, "exact": null, "includes": [], "excludes": [] },
  "custom":  { /* arbitrary JSON-Schema */ },
  "remote":  { "url": "https://...", "method": "POST", "body": "", "headers": {} },
  "quota":   { "config": { "<optionId>": 100 } }  // see note below
}
```

- `remote.method` is restricted to `"GET"` or `"POST"` — do not emit other HTTP verbs.
- `quota.config` maps an option id → max count for that option. Each value may be a number **or `null`**, and `config` itself may be `null`.

Which rules are meaningful depends on `fieldType`:

| Rule | Applies to |
|---|---|
| `basic` | All answerable field types. |
| `string` | `SHORT_TEXT`, `LONG_TEXT`, `EMAIL`, `PHONE_NUMBER`, `SECRETS`. |
| `numeric` | `NUMBER`. |
| `array` | `CHECKBOX`, `RADIO`, `DROPDOWN`, `DROPDOWN_MULTI`, `LINEAR`, `PRIVACY_POLICY_INFORMATION`, `PICTURE_CHOICE`. |
| `custom`, `remote` | Any field type. |
| `quota` | Option-bearing types: `RADIO`, `CHECKBOX`, `DROPDOWN`, `DROPDOWN_MULTI`, `PICTURE_CHOICE`. `config` maps an option id to its max count. |

### `outputSchema` — the submitted-value shape

`outputSchema` is a JSON-Schema object describing what a submission stores for this field. The general envelope:

```jsonc
{ "type": "...", "properties": {}, "required": [], "additionalProperties": true }
```

Concrete examples:

```jsonc
// SHORT_TEXT / LONG_TEXT / EMAIL / NUMBER / DATE — a plain string
{ "type": "string" }

// RADIO / DROPDOWN — an array narrowed to the field's actual option ids
{
  "type": "array",
  "items": { "type": "string", "enum": ["opt_yes", "opt_no"] }
}

// GEOLOCATION — a fixed object
{
  "type": "object",
  "properties": {
    "latitude":  { "type": "string" },
    "longitude": { "type": "string" }
  },
  "required": ["latitude", "longitude"]
}
```

The submitted-value category by field type:

| Submitted value | Field types |
|---|---|
| Array of strings | `RADIO`, `DROPDOWN`, `DROPDOWN_MULTI`, `CHECKBOX`, `PICTURE_CHOICE`, `PRIVACY_POLICY_INFORMATION`, `LINEAR` |
| Object mapping row id → array of column ids | `CHECKBOX_GRID`, `RADIO_GRID` |
| Object mapping row id → (column id → string) | `TABLE` |
| `{ "latitude": string, "longitude": string }` | `GEOLOCATION` |
| Payment result object (`status`, `orderId`, `amount`, optional `message`/`code`) | `TOSS_PAYMENTS` |
| `null` (collects no input) | `DESCRIPTION`, `WEBSITE_LINK`, `REJECT`, `SUBMIT`, `ENDING_REDIRECT`, `ENDING_DESCRIPTION` |
| Plain string | `NUMBER`, `DATE`, `TIME`, `SHORT_TEXT`, `LONG_TEXT`, `EMAIL`, `PHONE_NUMBER`, `ADDRESS`, `SECRETS`, `IMAGE_UPLOAD`, `VIDEO_UPLOAD`, `FILE_UPLOAD` |
| Defined by the field's own version (not inlined) | `CUSTOM` |

For selection, grid, and table fields the schema is normally narrowed to the field's actual option / row / column ids, so the value a submission carries references those ids rather than free strings.

For `TOSS_PAYMENTS`, `status` is one of a fixed set: `request_success`, `request_fail`, `confirm_fail`, `confirm_cancel`, `confirm_cancel_fail`.

---

## Special fields

Some entries in `formFieldsOrder` point at non-question fields:

- **Submit field** (`fieldType: "SUBMIT"`): the terminal node referenced from `submit.children`. Collects no input (its `outputSchema` is `null`). Its `properties` may carry `{ "buttonLabel"?: string }`. Can carry `branches`.
- **Ending fields** (referenced from `ending.children`): post-submission screens. Two types — `ENDING_REDIRECT` (`properties: { "redirectUrl": string }`) and `ENDING_DESCRIPTION` (a shown message). Ending fields have a minimal shape — `id`, `formId`, `label`, `fieldType`, `properties`, `outputSchema` — and never carry `branches` or `validations`.
- **Reject field** (`fieldType: "REJECT"`): a non-question terminal field that **disqualifies / screens out** a respondent mid-flow — when they reach it the form ends as *rejected* instead of completing. Collects no input. Unlike an ending (shown after a successful submission), it is reached *during* the field walk, typically via branch logic. See `walla://reference/field-types` for how to route to it.

---

## `hiddenFields`

A flat list of prefill / URL parameters carried with a submission but not shown as questions:

```jsonc
[
  { "id": "utm_source", "label": "Traffic source" },
  { "id": "ref",        "label": "Referrer" }
]
```

Each entry is `{ "id": string, "label": string }`. Branch conditions can reference a hidden field by this `id` (see `walla://reference/branch-logic`).

---

## Published vs. draft

`get_form` returns the editable draft (the rich, group-structured `formFieldsOrder` above). `get_published_form` returns an immutable snapshot taken at publish time, whose `formFieldsOrder` is **flattened** to only:

```jsonc
{
  "submit": { "children": ["fld_submit"] },
  "ending": { "children": ["fld_thankyou"] }
}
```

The published snapshot drops the `group_xxxxx` page structure and adds `formName` and `formDescription` string fields. When reading published forms, do not expect `group_*` keys; rely on `submit` and `ending` children.
