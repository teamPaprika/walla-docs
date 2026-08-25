# Editing payload shapes

The content shapes the `form_apply_edits` tool accepts when adding, updating, deleting, or reordering form content, and the invariants every edit must preserve. The read tools (`get_form` / `get_published_form` / `list_*`) return this same structure, so this reference also tells you how to interpret what you read.

> **What `form_apply_edits` can edit.** It edits fields and their layout: add / update / delete a field, reorder fields and groups, set a field's rich-text description (as HTML), set / clear a field's branch (skip/jump) logic via the `set_field_logic` / `clear_field_logic` ops — section (b), set the form's visual appearance (colors + next-button) via `set_form_appearance`, and set a group's page-break / label via `set_group` — section (d). A registered **`CUSTOM` (extension) field can also be added** — you bind it to an existing type/version via `customFieldTypeId` (see `walla://reference/custom-fields`), but you cannot author the custom field's input UI or value schema here.

> **Op envelope.** `form_apply_edits` takes `{ formId, ops: [...] }`, where each op is one of `add_field`, `update_field`, `delete_field`, `reorder`, `set_field_logic`, `clear_field_logic`, `set_form_appearance`, `set_group`. A field's content is passed **flattened** into an `add_field` / `update_field` op — its `fieldType`, `label`, `properties`, `validations`, and `descriptionHtml` are op keys, not a nested `field` object. Placement is part of the same `add_field` op (see "Placing the field"); only the standalone `reorder` op carries a whole `formFieldsOrder`; logic is set with `set_field_logic` (see (b)); form-level appearance and a single group's page-break are set with `set_form_appearance` / `set_group` (see (d)).

> Cross-links: value catalogs are not repeated here. For the field-type list, per-type `properties` shapes, validation, and the option `id`/`value`/`label` model, see `walla://reference/field-types`. For the branch/condition/operator model, see `walla://reference/branch-logic`. The full document layout (`formFieldsOrder`, field objects, hidden fields) is in `walla://reference/form-model`.

---

## How content is shaped (orientation)

A form has two layers you work with:

| Layer | What it holds | Edited by |
|---|---|---|
| **Field objects** | One object per question/screen: a server-assigned `id`, `label`, `fieldType`, `properties`, `validations`, and its `logic` (branch/skip rules, read via `get_form`; the raw `branches` array it compiles to is storage-only), … | `add_field` / `update_field`; logic via `set_field_logic` / `clear_field_logic` |
| **`formFieldsOrder`** | The ordered grouping of field ids into pages/groups + submit + ending | `reorder` op (and `add_field` / `delete_field` update it for you) |

A field's body and its position in `formFieldsOrder` are separate concepts, but you do **not** splice them together by hand when adding or deleting: `add_field` places the new field for you (via an anchor), and `delete_field` removes its id from its group. (`delete_field` rejects the always-present `submit` system field; ending and reject fields can be deleted.) You write `formFieldsOrder` directly only for the standalone `reorder` op.

---

## (a) Adding a field

An `add_field` op carries the field's content as flat keys. The server assigns the field `id` — you do **not** supply one (read it back from `get_form` after the edit).

```jsonc
{
  "op": "add_field",
  "fieldType": "RADIO",           // required — one of the canonical field types
  "label": "What is your role?",  // required — question text, max 400 chars
  "properties": {                 // type-specific; shape is dictated by fieldType
    "options": [
      { "label": "Engineer" },   // no id/value on add — the server mints option ids; value defaults to label
      { "label": "Designer" }
    ]
  },
  "validations": {                // optional; omit for defaults (nothing required)
    "basic": { "isRequired": true }
  },
  "descriptionHtml": "<h3>Tip</h3><p>Pick the closest match.</p>",  // optional rich-text description, as HTML (lead with a heading)

  // placement — all optional; default = append at the very end (see "Placing the field"):
  "anchorFieldId": "fld_AbCdEf123",
  "position": "after",
  "intoGroup": false
}
```

### Key contract

| Key | Required | Rule |
|---|:---:|---|
| `fieldType` | yes | Must be a canonical type — see `walla://reference/field-types` for the full list and which types collect input. To add a `CUSTOM` (extension) field, bind a registered type via `customFieldTypeId` (+ optional `customFieldVersionId`) — see `walla://reference/custom-fields`. |
| `customFieldTypeId` | conditional | **`CUSTOM` only — required then.** The id of a registered custom field type from `list_custom_field_types`; never invent one. Ignored for built-in types. |
| `customFieldVersionId` | no | **`CUSTOM` only.** Pins a specific version of that type; omit to bind the type's latest. The host fills in the version's `outputSchema` (version-owned, never yours to set) and its default `properties`; send `properties` only to override those defaults for this placement — validated against the version's schema (see `walla://reference/custom-fields`). |
| `label` | yes | Max 400 characters. An **internal** plain-text name (response tables, exports, field lists) — **not shown to the respondent**; the respondent sees `descriptionHtml`. |
| `properties` | conditional | Required when the type has a configurable shape (choice options, grid rows/columns, scale bounds, payment config, …). Omit / `{}` for types that take none (e.g. plain date, address, description). The shape **must** match the type — see `walla://reference/field-types`. |
| `validations` | no | Omit to mean "no constraints." Only the validation kinds a type supports are honored (matrix in `walla://reference/field-types`). |
| `descriptionHtml` | no | The field's rich-text description, written as **HTML** (lead with a heading) — **this is the question the respondent sees** (`label` is just an internal name). Write the field's real question here as complete text; don't leave it empty, and don't reduce it to a bare `label` echo. See `walla://reference/field-descriptions` for the supported tags and attributes. |
| field `id` | — | **Server-assigned** — do **not** supply one. It appears in `get_form` output after the field is created. |
| `branches` | — | **Not an `add_field` / `update_field` key** — set a field's branch (skip/jump) logic with the dedicated `set_field_logic` / `clear_field_logic` ops instead (see (b)). |

### How `properties` / options are shaped

The `properties` object is **discriminated by `fieldType`** — there is one shape per type. Do not mix shapes. The catalog of shapes and defaults lives in `walla://reference/field-types`; the load-bearing rules for editing are:

- **Choice fields** (single/multi-select, dropdown, picture choice, scale, consent) carry `properties.options`, an array of `{ id, label, value }`.
- **Grid fields** carry `properties.rows` (`{ id, label }` — **no `value`**) and `properties.columns` (`{ id, label, value }`). Columns are the selectable axis; rows scope each sub-answer.
- Option/row/column ids are **assigned by the server** when you add a field — like the field id, you do **not** supply them on an add (any id you send is ignored and re-minted). To reference a new option in same-batch logic, give it a `key` instead (see below). On an `update_field` that edits an existing field's options, you DO pass back the real ids `get_form` gave you, so unchanged options keep their identity; option `value` still mirrors `label` by default.
- **Keep `value` equal to `label`** unless you deliberately need a distinct stored value. This is the system default and what downstream consumers expect.
- The visible text is `label`; matching/logic resolves to `value`; the authoring/output schema is keyed on `id`. (Full rationale in `walla://reference/field-types`.)

```jsonc
// grid field properties (CHECKBOX_GRID / RADIO_GRID / TABLE)
{
  "rows":    [ { "id": "r4Kp9", "label": "Speed" } ],
  "columns": [ { "id": "cN2vX", "label": "Good", "value": "Good" } ]
}
```

### Referencing a new field or its options before the server assigns ids

Because the server mints field and option ids on add, you cannot know them when you write a same-batch `set_field_logic`. Use aliases:

- On `add_field`, set a `tempId` for the field and a `key` on each option (or grid row/column): `{ "op": "add_field", "fieldType": "CHECKBOX", "tempId": "q1", "properties": { "options": [ { "key": "yes", "label": "Yes" }, { "key": "no", "label": "No" } ] } }`.
- In the SAME batch's `set_field_logic`, reference the field as `@q1` (in `fieldId`, a condition's `field`, or a `goTo`'s `{ field }`) and an option as `@yes` (in `choiceIds`). The tool resolves every `@alias` to the real id, then validates and writes.
- The result's `added` array echoes the mapping, one entry per added field: `{ index, fieldId, tempId?, options?: [{ key?, id, label? }], rows?, columns? }`. Use it (or a later `get_form`) to learn the assigned ids.

Aliases must be unique within the batch and resolve **backwards only** — an op may reference fields/options added by an EARLIER op in the same `ops` array, never a later one (a forward reference is `invalid_args`). A real id never starts with `@`, so you can freely mix resolved ids and aliases. This collapses the old add → re-read → `set_field_logic` round-trip into a single call. `LINEAR` derives its options from `min`/`max`, so it takes no option keys.

### Placing the field

`add_field` positions the new field itself — you do **not** write `formFieldsOrder` for an add. The placement keys (all optional):

- **No anchor** → the field is appended **after the last group**, at the end of the question flow, **just before the submit step**.
- **`anchorFieldId`** names an existing placed field — get a real id from `get_form`. **`position`** is `"before"` or `"after"` it (default `"after"`).
- **`intoGroup`**: `true` puts the new field **inside the anchor's group**, next to it; `false` (or omitted) starts a **new group** just above/below the anchor's group.

The submit step is a **system field that always stays last** — you cannot place a field on it or anchor to it. For the **first** field in a new/empty form, just omit the anchor and it lands before submit.

**Adding several fields in order.** To add multiple fields in a chosen order, issue bare `add_field` ops (no anchor) in that order — they append in call order. Within a single batch, same-anchor adds also preserve order. But if you anchor across **separate** `form_apply_edits` calls, anchor each new field off the **previously-added** field's id (re-read it from `get_form` between calls) — reusing one fixed anchor across calls reverses the result.

**Grouping questions into sections.** Each bare `add_field` (no anchor) lands in its **own new group**, so a survey built entirely from bare adds ends up flat — one question per group. For a multi-question survey, consider grouping related questions into labeled sections instead: add the section's first field, then add the rest anchored to it with `intoGroup: true` (they join that same group); a new section starts whenever you add without `intoGroup`. `intoGroup` only takes effect **with** an anchor — on a bare add it is ignored. To name a section, re-read `get_form` for the minted `group_*` id, then `set_group { groupId, label }` (see (d)). This is optional structure — a short one-page form needs no sections.

A bad anchor — an unknown id, or a submit/ending field (you cannot place a question there) — returns `invalid_args`. To move an **existing** field, use the `reorder` op (c), not `add_field`.

Adding an **ending** field (e.g. `ENDING_REDIRECT`, `ENDING_DESCRIPTION`) is the exception: it routes into the `ending` group and **ignores** the placement keys above — ending screens have their own ordering.

---

## (b) Branch (skip/jump) logic — editable via `set_field_logic` / `clear_field_logic`

`form_apply_edits` sets a field's logic with the `set_field_logic` op (and clears it with `clear_field_logic`). You author logic in a **friendly** shape — `{ fieldId, rules?: [...], otherwise?: <goTo> }` — and `get_form` returns each field's logic in that same shape, so read → modify → write. Each rule is `{ when: [<condition>...], goTo: <target> }`: pass the option **ids** (read from `get_form`) as `choiceIds` to match a choice answer, or a literal `value` for text/number/date answers; a per-condition `connector` (`'and'`/`'or'`) folds left-to-right with **no precedence** (`[A, or B, and C]` = `((A or B) and C)`), and the first condition's connector just seeds the accumulator. `set_field_logic` REPLACES the field's logic, always appends one mandatory tool-owned `ALWAYS` default branch last (its target is the op's `otherwise`; default = continue to the next field, or — on the submit field — the default ending), and refuses to overwrite a field whose stored branches are not friendly-representable (edit those in the Walla editor). The raw branch shape below is what your friendly logic compiles to; the condition/operator model is in `walla://reference/branch-logic`.

A branch is one routing rule on a field: *"when `conditions` hold, JUMP to `target`."* A field's `branches` array holds objects of this shape:

```jsonc
{
  "id": "br_7yHk2",            // unique within the field's branches; not a default-branch id
  "parentId": "fld_AbCdEf123", // the id of the field this branch belongs to
  "conditions": [
    {
      // first condition: conditionPrefix is not load-bearing (no preceding condition
      // to combine with). AND/OR only matters from the SECOND condition onward.
      "operands": [                       // exactly 2 operands when present
        { "type": "FIELD",  "value": { "id": "fld_AbCdEf123" } },
        { "type": "CHOICE", "value": { "choiceIds": ["Wq8RtY2bP"] } }
      ],
      "operator": "CONTAINS_ANY"          // see branch-logic for the operator catalog
    },
    {
      "conditionPrefix": "AND",           // combines THIS condition with the one above
      "operands": [
        { "type": "FIELD",  "value": { "id": "fld_Other" } },
        { "type": "CHOICE", "value": { "choiceIds": ["optYes"] } }
      ],
      "operator": "CONTAINS_ANY"
    }
  ],
  "action": {
    "id": "br_7yHk2-action",
    "type": "JUMP",                       // only JUMP exists
    "target": { "type": "FIELD", "value": "fld_NextOne" }
  }
}
```

### How to read a branch

- `action.type` is always `"JUMP"`. `action.target.type` is one of `"FIELD"`, `"SUBMIT"`, `"ENDING"`.
- `action.target.value` is either a **sentinel** or a node id:
  - `{ "type": "FIELD", "value": "NEXT" }` — go to the next field in order.
  - `{ "type": "FIELD", "value": "<fieldId>" }` — jump to a specific field.
  - `{ "type": "FIELD", "value": "SUBMIT" }` — the FIELD→submit-node form; terminates at the submit node.
  - `{ "type": "ENDING", "value": "SUBMIT" }` — the default submit/ending screen. This is how authored submit-node branches are written (see "Submit-node branches" below).
  - `{ "type": "ENDING", "value": "<endingId>" }` — a specific ending screen.
  - A bare `{ "type": "SUBMIT" }` is a runtime-accepted terminal form (the walker keys on `type === "SUBMIT"`); authored submit destinations are written as `type: "ENDING"`.
- A **conditional** condition has **exactly 2 `operands`** plus an `operator`. Compound logic is an *array* of conditions chained by each one's `conditionPrefix` (`AND`/`OR`) — never by adding more than two operands. The `conditionPrefix` selects how a condition combines with the **preceding** one, so it is only meaningful from the second condition onward.
- A **default** condition is `{ "conditionPrefix": "ALWAYS" }` with **no** `operands` and **no** `operator`.
- For a `CHOICE` operand, `value.choiceIds` references **current option ids** of the compared field. A choiceId not in the field's options means the branch draws no edge at runtime.
- Operand/operator value catalogs and how each operand resolves at fill time live in `walla://reference/branch-logic`.

### Submit-node branches target endings

The submit node carries branches whose targets are **endings** (`type: "ENDING"`), not fields. Its default branch targets `{ "type": "ENDING", "value": "SUBMIT" }` (the default submit screen). Conditional submit branches select a specific ending by `{ "type": "ENDING", "value": "<endingId>" }`.

---

## (c) Reordering fields and groups within `formFieldsOrder`

The `reorder` op replaces the form's `formFieldsOrder` object. `formFieldsOrder` controls page/screen layout and field sequence. Its shape:

```jsonc
{
  "submit": { "children": ["fld_submit"] },        // always present
  "ending": { "children": ["end_thanks"] },        // optional
  "group_a1b2c": {                                  // one per page/group; key must match group_<slug>
    "order": 0,                                     // render order among groups (the server renumbers this)
    "chaining": "APPEND",                           // APPEND | PRESS_BUTTON
    "children": ["fld_AbCdEf123", "fld_NextOne"],   // ordered field ids in this group
    "label": "Section 1"                            // optional editor label
  }
}
```

The `reorder` op takes the **full** updated object. The shapes you produce:

- **Move a field within / across groups** — remove its id from the source group's `children` and splice it into the target group's `children` at the desired index.
- **Reorder fields in a group** — reorder the strings in that group's `children`.
- **Reorder groups (pages)** — change each group's `order`. The server **renumbers `order`** into a clean sequence, so small gaps or duplicates are tolerated — just keep the relative order you intend.
- **New group** — add a `group_<slug>` key whose `slug` matches `^[A-Za-z0-9_]+$` (only `submit`, `ending`, and `group_*` keys are permitted). Set its `order`, `chaining` (default `"APPEND"`), and `children`.

> Adding or deleting a field is done by the `add_field` / `delete_field` ops in (a) — those update `formFieldsOrder` for you. Write `formFieldsOrder` yourself only for `reorder`.

---

## (d) Form-level settings — `set_form_appearance` and `set_group`

Two ops edit form-level settings that live outside any single field: the form's visual appearance (colors + next-button) and a group's page-break boundary / label. Both are **partial-merge singletons** — you send only the keys you want to change, and every other existing key is preserved. (These settings live on the form's `data` map; see `walla://reference/form-model` for where they sit and how page-breaks render.)

### `set_form_appearance` — colors + next-button

A form-level **partial update (merge)** of `colorPalette` and `pageTransitionSetting`:

```jsonc
{
  "op": "set_form_appearance",
  "colorPalette": {
    "primary": "#007eff",            // hex — button color
    "background": "#ffffff",         // hex — page background
    "foreground": "#111111",         // hex, or null → "auto" (clears the key)
    "primaryForeground": null        // hex (button text color), or null → "auto"
  },
  "pageTransitionSetting": {
    "hideNextButton": false,
    "nextButtonLabel": "Continue"    // ≤ 20 chars
  }
}
```

Merge semantics:
- Only the keys you send overwrite existing values.
- `colorPalette.primary` / `background` are always-present required values → **preserved by partial merge, never dropped**.
- `foreground` / `primaryForeground`: a hex string sets it; `null` resets it to "auto" (the key is removed); omitting it leaves it unchanged.
- `pageTransitionSetting` is also partial-merged into the existing object.

Validation (`invalid_args`):
- Each color must be a 6-digit hex string (`#rrggbb`, case-insensitive).
- `nextButtonLabel` length ≤ 20.
- An empty op (neither `colorPalette` nor `pageTransitionSetting`, or no valid key inside either) is rejected.

### `set_group` — page-break (`chaining`) + label

A group-level **partial update (merge)** that sets a page boundary (`chaining`) and/or the group's editor label. Both are properties of the same `group_*` entry, so one op covers both:

```jsonc
{
  "op": "set_group",
  "groupId": "group_a1b2c",          // from get_form's groups[].groupId
  "chaining": "PRESS_BUTTON",        // page boundary — "PRESS_BUTTON" = page ends at this group
  "label": "Section 1"               // group label, or null → removes the label
}
```

Merge semantics (same as `set_form_appearance`):
- Only the keys you send overwrite the existing group. Sending `chaining` alone toggles the page boundary; sending `label` alone changes only the label; sending both changes both.
- `label`: a string sets it; `null` removes it (no label); omitting it leaves it unchanged.

Validation (`invalid_args` / `not_found`):
- `groupId` must be a real `group_*` in the current order. Unknown → `not_found`; `submit` / `ending` (which are not question groups and have no `chaining` / `label`) → `invalid_args`.
- `chaining` must be `"APPEND"` or `"PRESS_BUTTON"`.
- `label` must be a string ≤ 30 chars, or `null`.
- An empty op (neither `chaining` nor `label`) is rejected.

`set_group` targets **groups that already exist** at the start of the batch — the server mints group ids (there is no group alias), so to page-break a group you must first read its `groupId` from `get_form`'s `groups` view, then `set_group { groupId, chaining }`.

Batch guard:
- `set_group` and `reorder` **cannot be combined in one batch** (both rewrite `formFieldsOrder`); use separate calls. This mirrors the existing `add_field` ⊗ `reorder` mutual exclusion.
- `set_group` may coexist with `add_field` as long as it targets a group that already existed before the batch (new groups added in the same batch are not yet addressable).
- `set_form_appearance` composes freely with anything (it is independent of field structure).

---

## Invariants every edit must preserve

The tool validates these and rejects an edit that would break them (`invalid_args`).

| Invariant | Rule |
|---|---|
| **Option `{id,label,value}` consistency** | Every option carries all three strings. `id` is unique within the field; `value` defaults to `label`. Grid rows carry only `{id,label}`. |
| **Option ids are never reused** | Option/row/column ids are opaque and permanent. Never re-issue an id that existed before, even after deletion. Generate new ids for new content. (The field `id` itself is server-assigned, so you never mint one.) On add the server assigns option/row/column ids too (like the field id), so you cannot pre-key anything by them in the same op; on update your ids are the stable anchor and are preserved. |
| **`id` is the stable anchor** | Renaming a `label` (or changing a `value`) must keep the option `id` unchanged — branch `choiceIds` and quota keys reference ids, so rotating ids silently breaks existing logic. |
| **`properties` matches `fieldType`** | The `properties` shape must be the one that type expects. A mismatched shape is invalid even if it round-trips. |
| **`formFieldsOrder` integrity** | `submit.children` always exists; group keys are only `submit` / `ending` / `group_*`; every id in any `children` must correspond to a real field, and every field must appear in exactly one group. (The server renumbers `order`, so contiguity is not something you must hand-maintain.) |

Branches obey invariants `set_field_logic` enforces for you — the `ALWAYS` default branch is always last and is mandatory (the tool appends it from your `otherwise`, so a no-match answer always falls through to it rather than dead-ending), and every condition references a real field, real option ids, and (on the submit field) a real ending — a dangling reference is rejected with `invalid_args`. You don't hand-author the trailing default; you supply rules + an `otherwise`, and the tool builds the branch array.

> Error semantics for rejected edits (forbidden / not_found / invalid_args / payment_required / internal) follow the standard error contract described in the server instructions; not repeated here.

## Paid features

> **`update_field` deep-merges, it does not replace.** `properties` and `validations` you send are merged
> **into** the field's existing objects, recursing into nested objects and overwriting only the leaves you
> include (arrays and primitives are overwritten whole). Two consequences: (a) you may send just the keys you
> are changing — untouched settings survive; (b) **you cannot remove a setting by omitting it.** To clear one,
> send its off-value explicitly (`validations.quota.config: null`,
> `properties.isFileVolumeLimited: false`). Sending a trimmed-down `validations` object does **not** delete the
> kinds you left out.

Some field types and settings require a paid team plan. Setting one on a team whose plan lacks it rejects the **whole batch** with `payment_required` — a retryable error that carries a short upgrade message (the feature, the required plan, and an upgrade link). Relay that message to the user, then retry without the paid setting if the rest should still apply. Plan-gated surfaces:

| Surface | Where in an op | Gated values |
|---|---|---|
| Paid field **types** | `add_field` `fieldType` | `TOSS_PAYMENTS`, `SECRETS`, `ENDING_DESCRIPTION`, `ENDING_REDIRECT`. `CUSTOM` is **not** gated here — attaching an already-registered custom field type is open to every plan; the plan caps only how many types a team may create (see `walla://reference/custom-fields`). |
| Response **quota** | `validations.quota.config` on `update_field` (non-empty) | per-option response caps; set after the field exists — quota on add_field is rejected (option ids are assigned on create) |
| File **volume limit** | `properties.isFileVolumeLimited: true` | upload size cap |
| Numeric/custom **option values** | option / grid-column `value` ≠ `label` (on `update_field`) | scored choices |
<!-- feature:phoneVerification -->
| **Phone verification** | `validations.phoneVerification.enabled` on `add_field` / `update_field` | `true` only (Enterprise). Sending `false` is free, so a downgraded team can still turn it off — but you must send it **explicitly**: omitting the key leaves the option ON (see the merge note above). |
<!-- /feature:phoneVerification -->
