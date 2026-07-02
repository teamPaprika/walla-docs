# Walla conditional logic

Reference for the raw `branches` array on a form field — the STORAGE model the routing engine reads at runtime. Form-retrieval tools (`get_form`) and the write ops (`set_field_logic` / `clear_field_logic`) speak a friendlier `logic` shape instead; this doc explains the underlying `branches` that `logic` compiles to, so you can reason about what a write produces.

Conditional logic (a.k.a. branch / skip / jump logic) decides what a respondent sees *after* they answer a field: the next field, a specific field further ahead, or an ending screen. Each field carries a `branches` array internally; each branch is one rule of the form **"when these conditions hold, JUMP to this target."** This `branches` array is **storage**: the form-retrieval tools do not expose it directly — `get_form` decompiles it into a friendly `logic` shape on each field (a field with no real logic carries no `logic` key), and the same shape is what you **write** through `form_apply_edits` via the `set_field_logic` / `clear_field_logic` ops (which take a friendly rules/`otherwise` shape and compile back to the raw `branches` documented here). So read `field.logic` from `get_form`, modify it, and write it back with `set_field_logic`; the raw `branches` below let you reason about what that write produces. The submit step has its own branches that pick the ending screen.

For form/field/page discovery, see the server instructions. For field shapes and option ids, see `walla://reference/field-types` (and other `walla://reference/*` siblings).

---

## 1. Branch object shape

A branch lives at `field.branches[i]`:

```jsonc
{
  "id": "string (<= 40 chars, unique within the field)",
  "parentId": "string — id of the field this branch belongs to",
  "conditions": [ /* array of condition objects — see §3 */ ],
  "action": {
    "id": "string",
    "type": "JUMP",                  // only value that exists
    "target": {
      "type": "FIELD | SUBMIT | ENDING",
      "value": "<sentinel | field id | ending id>"   // see §2
    }
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Default branch ids start with `default-branch-` (reserved — don't reuse). |
| `parentId` | yes | The owning field's id. For submit branches, the submit node's id. |
| `conditions` | yes | Evaluated top-to-bottom; see §3. An `ALWAYS` condition makes the branch a default. |
| `action.type` | yes | Always `"JUMP"`. Any other value is ignored at runtime. |
| `action.target.type` | yes | One of `FIELD`, `SUBMIT`, `ENDING`. |
| `action.target.value` | yes | A sentinel string or a node id. |

**Branch order is a priority list.** Evaluation takes the **first** branch whose conditions match and stops. Put more specific conditional branches first; the default (`ALWAYS`) branch must be last.

---

## 2. Target kinds and sentinels

`action.target` says where a matched branch sends the respondent.

| `target.type` | `target.value` | Result |
|---|---|---|
| `FIELD` | `"NEXT"` (sentinel) | Go to the next field in order. |
| `FIELD` | `<field id>` | Jump to that specific field (may be on a later page). |
| `FIELD` | `"SUBMIT"` (sentinel) | Jump to the submit node (ends the field walk). |
| `SUBMIT` | `"SUBMIT"` | Reach the submit node directly. |
| `ENDING` | `"SUBMIT"` (sentinel) | Show the default submit / thank-you screen. |
| `ENDING` | `<ending id>` | Show that specific ending screen. |

Reserved sentinel strings: **`"NEXT"`** and **`"SUBMIT"`**. A real field or ending id must never equal these.

- On a **normal field**, use `FIELD` targets (`"NEXT"`, a field id, or `"SUBMIT"` to finish).
- On the **submit node**, use `ENDING` targets (`"SUBMIT"` for the default screen, or a specific ending id).
- `ENDING` targets on a normal field's branch are **not** routed — ending selection happens only at the submit node.
- To **screen out / disqualify** a respondent, route to a `REJECT` field with a `FIELD` target (`target.value` = the reject field's id): reaching it ends the form as *rejected*, which is distinct from an `ENDING` (post-submission) screen. See `walla://reference/field-types`.

A `target.value` pointing at a deleted/nonexistent field or ending is invalid and routes nowhere; keep every id pointing at a current node.

---

## 3. Conditions

`conditions` is an array. Each entry is a single **binary comparison**, joined to the running result by its `conditionPrefix`. There is no operator precedence — prefixes fold strictly left-to-right against one accumulator, and the *first* condition's prefix is ignored (it just seeds the result). So `[A, OR B, AND C]` evaluates as `((A OR B) AND C)`.

```jsonc
{
  "conditionPrefix": "AND | OR | ALWAYS",
  "operator": "EQUAL | ... ",       // omit for ALWAYS
  "operands": [ <operand0>, <operand1> ]   // EXACTLY 2; omit for ALWAYS
}
```

| Field | Rule |
|---|---|
| `conditionPrefix` | `AND` / `OR` join this condition to the previous result. `ALWAYS` = unconditional match (default branch). |
| `operands` | Exactly **2** when present. Compound logic = multiple conditions, never more operands. Omitted for `ALWAYS`. |
| `operator` | One of the operators in §5. Omitted for `ALWAYS`. |

A comparison runs only when **both** resolved operands are non-empty. If the referenced field is unanswered, the condition is simply `false` — it never errors.

### Operand shape

```jsonc
{
  "type": "FIELD | CHOICE | CONSTANT | HIDDEN | VARIABLE",
  "value": {
    "id": "<field id>",          // when type is FIELD
    "data": <any literal>,        // when type is CONSTANT
    "choiceIds": ["<option id>"]  // when type is CHOICE
  }
}
```

Include only the one `value` sub-field that matches the operand `type` (per the table below); omit the others.

| Operand `type` | Resolves to | Which `value` field | Evaluated? |
|---|---|---|---|
| `FIELD` | The respondent's answer to that field | `value.id` | Yes |
| `CONSTANT` | The literal you author | `value.data` | Yes |
| `CHOICE` | The option *values* for the given option ids | `value.choiceIds` | Yes |
| `HIDDEN` | (hidden-field value) | `value.id` | **No — not evaluated; will never match** |
| `VARIABLE` | (variable value) | `value.id` | **No — not evaluated; will never match** |

Conventions that make a valid comparison:
- **Operand 0** is the thing being tested — almost always a `FIELD` (the question's answer).
- **Operand 1** is what it's compared against — a `CONSTANT` (typed literal) for text/number/date fields, or a `CHOICE` (option ids) for single/multi-select fields.
- A `CHOICE` operand only resolves if its **sibling operand in the same condition is a `FIELD`** — it reads that field's option list to translate `choiceIds` into option values. A `CHOICE` with no `FIELD` sibling cannot resolve.
- Do **not** rely on `HIDDEN` or `VARIABLE` operands to route — they currently resolve to nothing and fail the non-empty check.

---

## 4. The default branch (required, must be last)

Every branchable field's `branches` array must **end** with a default branch: one condition with `conditionPrefix: "ALWAYS"` (no operands, no operator), which always matches. It is the universal fallthrough — if no conditional branch above it matches, it fires. A field whose array lacks an `ALWAYS` default at the end is malformed.

Canonical default for a normal field (continue to next field):

```jsonc
{
  "id": "default-branch-<fieldId>",
  "parentId": "<fieldId>",
  "conditions": [ { "conditionPrefix": "ALWAYS" } ],
  "action": {
    "id": "default-branch-action-<fieldId>",
    "type": "JUMP",
    "target": { "type": "FIELD", "value": "NEXT" }
  }
}
```

Canonical default for the **submit node** (show default ending screen) is the same shape with `target: { "type": "ENDING", "value": "SUBMIT" }`.

---

## 5. Operators

`a` = left operand value, `b` = right operand value. Both are normalized to flat arrays before comparison (a scalar answer becomes a 1-element array; multi-select stays an array; empty/missing becomes `[]`). "Applies to" is the value family each operator is designed for; it does not block other kinds.

| Operator | Plain meaning | Applies to |
|---|---|---|
| `EQUAL` | `a` and `b` are the same set of values | scalar or multi-value |
| `NOT_EQUAL` | `a` and `b` differ | scalar or multi-value |
| `CONTAINS_ALL` | `a` contains **every** value in `b` | multi-value / choice |
| `CONTAINS_ANY` | `a` contains **at least one** value in `b` | multi-value / choice |
| `CONTAINS_NONE` | `a` contains **none** of the values in `b` (all absent) | multi-value / choice |
| `NOT_CONTAINS_ALL` | **at least one** value in `b` is missing from `a` | multi-value / choice |
| `BEGINS_WITH` | `a` (first value, as text) starts with `b` | string |
| `ENDS_WITH` | `a` ends with `b` | string |
| `STRING_CONTAINS` | `a` contains `b` as a substring | string |
| `STRING_NOT_CONTAINS` | `a` does not contain `b` | string |
| `LOWER_THAN` | `a < b` numerically | numeric |
| `LOWER_EQUAL_THAN` | `a <= b` | numeric |
| `GREATER_THAN` | `a > b` | numeric |
| `GREATER_EQUAL_THAN` | `a >= b` | numeric |
| `EARLIER_THAN` | `a` is before `b` (as dates) | date |
| `EARLIER_THAN_OR_ON` | `a` is on or before `b` | date |
| `LATER_THAN` | `a` is after `b` | date |
| `LATER_THAN_OR_ON` | `a` is on or after `b` | date |

Notes:
- String, numeric, and date operators only use the **first** value of each operand.
- Set/membership operators (`EQUAL`, `NOT_EQUAL`, `CONTAINS_*`) compare the whole arrays — these are the ones to use with multi-select fields and `CHOICE` operands.
- `CONTAINS_NONE` (*all listed values absent*) is distinct from `NOT_CONTAINS_ALL` (*at least one listed value absent*).
- To express "the respondent selected option X" against a choice field, the natural pattern is a `FIELD` operand + a `CHOICE` operand with `CONTAINS_ANY` (or `CONTAINS_ALL` for "selected all of these").

---

## 6. Worked example: "if Q1 = No, jump to Q5"

Q1 (`field_q1`) is a single-choice field with options `opt_yes` ("Yes") and `opt_no` ("No"). Goal: if the answer is "No", jump to `field_q5`; otherwise continue to the next field.

`field_q1.branches`:

```jsonc
[
  // Conditional branch: Q1 answer includes the "No" option -> jump to Q5.
  {
    "id": "branch_q1_no",
    "parentId": "field_q1",
    "conditions": [
      {
        "conditionPrefix": "AND",   // first condition: prefix only seeds the accumulator
        "operator": "CONTAINS_ANY",
        "operands": [
          { "type": "FIELD",  "value": { "id": "field_q1" } },
          { "type": "CHOICE", "value": { "choiceIds": ["opt_no"] } }
        ]
      }
    ],
    "action": {
      "id": "action_q1_no",
      "type": "JUMP",
      "target": { "type": "FIELD", "value": "field_q5" }
    }
  },

  // Default branch (ALWAYS, always last): continue to the next field.
  {
    "id": "default-branch-field_q1",
    "parentId": "field_q1",
    "conditions": [ { "conditionPrefix": "ALWAYS" } ],
    "action": {
      "id": "default-branch-action-field_q1",
      "type": "JUMP",
      "target": { "type": "FIELD", "value": "NEXT" }
    }
  }
]
```

Behavior: answer "No" → `branch_q1_no` matches first → jump to `field_q5` (any fields between are skipped). Answer "Yes" → that branch fails → the `ALWAYS` default fires → go to the next field in order.

---

## 7. Authoring rules (branch logic IS editable through `form_apply_edits`)

`form_apply_edits` adds and edits branches via the `set_field_logic` / `clear_field_logic` ops, which take a friendly rules/`otherwise` shape and compile to the raw `branches` below; `get_form` returns the same friendly shape, so read → modify → write. The rules below define a valid branch so you can both interpret the logic you read and reason about what a write produces. A valid branch must:
1. Keep `action.type` = `"JUMP"` and put exactly the target shapes from §2.
2. Every condition has **exactly 2 operands** (except `ALWAYS`, which has none). Build compound logic from multiple conditions, not extra operands. Remember: prefixes fold left-to-right with no precedence.
3. Always end the array with an `ALWAYS` default branch (mandatory and tool-owned — `set_field_logic` appends it for you from the op's `otherwise` target, so you never author it). When no conditional branch matches, this trailing default is what fires; keep conditional branches above it in priority order.
4. Operand 0 = `FIELD`; operand 1 = `CONSTANT` (text/number/date) or `CHOICE` (option ids, with a `FIELD` sibling). Avoid `HIDDEN` / `VARIABLE` — they won't route today.
5. Use real, current ids for `target.value` and operand `value.id` / `choiceIds`; never collide with the `"NEXT"` / `"SUBMIT"` sentinels.
6. On the submit node, branches select endings: `ENDING` targets with `"SUBMIT"` (default screen) or a real ending id.

Never include secrets, response data, or internal-only fields in branch objects.
