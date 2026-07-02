# Custom (extension) fields

How to recognize a custom (extension) field when you read it, how to **discover** the custom field types a team already has, and how to **place** one into a form draft. Two things you cannot do through these tools: you cannot author a custom field's input UI or value schema, and you cannot register a new type or version — those are created elsewhere. Here you only discover existing custom field types and add instances of them to a form.

## What a custom field is

A **custom field** is an extension field type whose input UI and whose saved-value shape are **defined externally, per custom-field version** — not authored through these tools. From your perspective the field's *internals* are opaque: you can see *that* a field is a custom field, *which* extension type/version it points to, and the JSON Schema describing the value it stores, but you cannot define or change any of that here.

What you *can* do: list the custom field types a team already has (so you can find a real `customFieldTypeId`), and add an instance of one to a form's draft. You never invent a type or version — you bind to one that already exists.

## How it appears in a field object

When you read a form (`get_form` / `get_published_form`), a custom field is just another entry in the fields array, distinguished by its field type. Its identifying shape:

```jsonc
{
  "id": "<opaque field id>",          // this field's id within the form
  "fieldType": "CUSTOM",               // the discriminator — this is a custom/extension field
  "label": "School lookup",
  "customFieldTypeId": "<opaque id>",  // which extension type this field is an instance of
  "customFieldVersionId": "<opaque id>",// the pinned extension version (defines UI + schemas)
  "outputSchema": { … },               // JSON Schema for the value this field stores (see below)
  "properties": { … }                  // author-configured settings for this instance
}
```

> IDs (`id`, `customFieldTypeId`, `customFieldVersionId`) are opaque strings — do not assume a prefix or format. A type id can look like `cf_anyang_workload` and a version id is just an arbitrary string; match and compare them as-is, never parse them.

| Key | Type | What it tells you |
|---|---|---|
| `fieldType` | string | Always `"CUSTOM"` for an extension field. This is how you detect one. |
| `customFieldTypeId` | string | Identifies the extension type. Two custom fields with the same value here are instances of the same type. |
| `customFieldVersionId` | string | The pinned version of that type. The version is what actually defines the input UI and the value schema. Different versions of the same type can have different `outputSchema`. |
| `outputSchema` | object (JSON Schema) | Describes the shape of the value this field saves. Use it to interpret the field's role; do not assume a primitive — custom values are frequently structured objects. |
| `properties` | object | Per-instance configuration the author set (e.g. a mode toggle, a selected catalog). The set of allowed keys is defined by the extension version, not by you. |

If `fieldType` is **not** `"CUSTOM"`, it is a built-in field — see the field-type catalog in `walla://reference/field-types`.

## Interpreting `outputSchema`

`outputSchema` is a standard JSON Schema. It is the single externally-true contract for what the field's stored value looks like. The shapes below are **examples produced by specific fields, not a fixed schema** — always read the field's own `outputSchema`, never assume:

- a simple scalar (e.g. a hex color string),
- a compact structured object (e.g. `{ "type": "signature", "strokes": […] }`),
- a composite answer object (e.g. `{ "department": "…", "entries": [ … ] }`).

Read `outputSchema` to understand the value's structure. Note that an `outputSchema` may intentionally omit `enum`s for fields whose allowed values come from an external catalog (so that catalog can change without re-registering the version) — so a missing `enum` does not mean any value is acceptable.

## The `properties._observedFields` key (cross-field custom fields)

Some custom fields are configured to read other fields in the same form. When so configured, you may see a **system-reserved** key inside `properties`:

```jsonc
"properties": {
  "operator": "sum",
  "_observedFields": [
    { "kind": "field",  "id": "f_qty" },        // references a regular field by its id
    { "kind": "hidden", "label": "utm_discount" }// references a hidden field by its label
  ]
}
```

| Ref shape | Resolves to |
|---|---|
| `{ "kind": "field", "id": "<fieldId>" }` | another regular field in the form, matched by its `id` |
| `{ "kind": "hidden", "label": "<label>" }` | a hidden field, matched by its author-defined `label` |

How to read it:

- The `_` prefix marks it as system-reserved. Any key in `properties` that begins with `_` is host-managed bookkeeping, not author-facing configuration.
- **Order is significant** — the array reflects the author's intent and can matter to the field's computation.
- This array is the set of fields the custom field *requested* to read. The actual data it receives at runtime may be a strict subset (host filtering removes the field itself and any sensitive fields). You do not control or see that runtime filtering through these tools.
- `_observedFields` only takes effect when the field's **version** declared observation at build time (an `observeFields.json` of `{ "mode": "configured" }` among the build's submitted files). A version whose `observeFields` is null or `"none"` receives **no form context at all** — the host sends nothing regardless of `_observedFields`, and the field renders its empty state even when the observed answers exist.
- The whitelist is set **per placement**, either in the dashboard's field settings or through `form_apply_edits` (`add_field` / `update_field`, inside `properties`). `_observedFields` is the ONE caller-settable `_`-prefixed key; every other reserved key is rejected.
- Writes are strictly validated (it is a privacy gate): each entry must match a tagged shape above exactly, every `{ "kind": "field" }` id must resolve to a field that exists on this form (a field added earlier in the same batch counts), and a field can never observe itself. An invalid ref fails the whole batch with `invalid_args` naming the offending entry.

You may set `_observedFields` through `form_apply_edits`; treat it as host-validated configuration, not free-form JSON — and remember it does nothing unless the version declared observation (previous bullet).

**Giving members a picker UI.** The dashboard's field-settings dialog shows a field-picker for `_observedFields` only when the **version's `propertiesSchema` declares it** — the picker is matched by schema *shape*, not by key name. A version built without this node still works with `form_apply_edits`-written refs; the member just has no editor UI for them. To get the picker, the build's `propertiesSchema.json` must include:

```jsonc
"_observedFields": {
  "type": "array",
  "title": "관찰할 필드",
  "items": { "oneOf": [
    { "type": "object", "properties": { "kind": { "const": "field" },  "id":    { "type": "string" } }, "required": ["kind", "id"] },
    { "type": "object", "properties": { "kind": { "const": "hidden" }, "label": { "type": "string" } }, "required": ["kind", "label"] }
  ] }
}
```

## Discovering a team's custom field types (`list_custom_field_types`)

`list_custom_field_types(teamId)` returns the custom field types this **team** already has — the only way to learn valid `customFieldTypeId`s. Never invent one; obtain it here.

Each entry carries:

| Key | What it tells you |
|---|---|
| `customFieldTypeId` | The id you pass to `add_field` to place an instance of this type. |
| `name` | The type's human-readable name. |
| `description` | A short description of what the type does (may be null). |
| `latestVersionId` | The id of the type's newest version (may be null if the type has no versions). This is the version `add_field` binds to when you don't pass an explicit `customFieldVersionId`. |
| `outputSchema` | The latest version's `outputSchema` — the shape of the value a field of this type saves. |

Notes:

- The list is **team-scoped**: it returns only this team's own custom field types, not shared or platform-wide ones.
- Discovery is offered alongside the read tools (it needs read access). It also requires the team's plan to include custom fields — a team whose plan lacks them gets `payment_required` (see Gating below).
- Use it before adding a custom field: if a suitable type already exists, reuse it rather than asking for a near-duplicate.

## Adding / placing a custom field (`add_field` with `fieldType: "CUSTOM"`)

`form_apply_edits` can add a custom field via an `add_field` op with `fieldType: "CUSTOM"`. You bind it to an already-registered type/version; you do not author its UI or schemas:

| Key | Required | What it does |
|---|---|---|
| `customFieldTypeId` | **required** | The type to place, taken from `list_custom_field_types`. Never invented. |
| `customFieldVersionId` | optional | Pins the field to a specific version of that type. **Omit it to default to the type's latest version.** If supplied, it must belong to the given type. |
| `properties` | optional | Per-instance configuration for this placement. Merged onto the version's default `properties` and validated against the version's `properties` schema; omit to take the defaults unchanged. Sending a key the version's schema doesn't allow (or any `properties` when the version declares none) is rejected. |

The host resolves the version (explicit, or the latest) and fills in that version's `outputSchema` for you — `outputSchema` is version-owned and you can never set or change it. The version's default `properties` are filled in too; you only send `properties` when you want to override those defaults for this one placement (see above). A custom field cannot be added through the generic add path used for built-in types; it always goes through this dedicated `customFieldTypeId`/`customFieldVersionId` binding.

You can change a placed custom field's per-instance `properties` later with an `update_field` op (merged onto its current `properties`, `outputSchema` left untouched), and its `label` / `validations` / `descriptionHtml` — but not which type or version it is pinned to.

See `walla://reference/editing-contract` for the full `add_field` op shape and the field placement options shared with built-in fields.

## Gating: `payment_required`

Custom fields are a paid feature. **Both** the discovery tool (`list_custom_field_types`) **and** adding a `CUSTOM` field via `add_field` are gated by the team's plan: if the team's plan does not include custom fields, the call fails with `payment_required` and a short, user-facing upgrade message. Relay that message to the user; do not retry the same call without an upgrade. (The global error contract is in the server instructions.)

## What you cannot do here

- You cannot create a custom field type or version, nor define its input UI, `properties` schema, or `outputSchema` — those are registered elsewhere, not through these tools.
- You cannot change which version an existing field is pinned to after the fact (`customFieldVersionId` on a placed field), beyond choosing the version at the time you add it.
- You cannot author the field's runtime behavior or read its stored response values through this reference.

## Related references

- `walla://reference/field-types` — the catalog of built-in (non-custom) field types and their shapes.
- `walla://reference/editing-contract` — the `form_apply_edits` op shapes, including `add_field`.

The discovery chain (`list_teams` → `list_workspaces` → `list_forms` → `get_form` / `get_published_form`) and the error contract are described in the server instructions; this reference does not repeat them.
