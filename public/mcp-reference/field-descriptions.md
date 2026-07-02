# Field description format

How a form field's rich-text **description** is represented as HTML, and how you author one with `form_apply_edits` (you provide the description as **HTML**, via the `descriptionHtml` field).

## What a description is — the respondent-facing prompt

A field's **description** is the rich-text **question the respondent actually sees** — it is rendered as the field's prompt, above the input. It is **not** secondary help text. The field's `label` is a separate plain-text name used only on your side (response tables, exports, field lists) and is **never shown to the respondent**, so a field with a `label` but an empty description shows the respondent no question at all.

Because of that, **author a real `descriptionHtml` for every field**: the description is where the question text belongs, so write it as a clear, complete question (lead with a heading, e.g. `<h3>How satisfied were you with our service?</h3>`). The `label` is only a short internal name for the same field — if the label already holds the full question you can reuse it verbatim, but don't reduce a description to a terse label echo, and never leave it empty (the respondent would then see no question at all).

**Keep a hierarchy — one heading for the question, blocks for the rest.** The leading heading holds only the concise question itself; put any elaboration, examples, options guidance, or instructions in the following `<p>`, list, or other blocks. Do not cram the whole prompt into the heading, and do not make every sentence its own heading — that flattens the hierarchy the respondent relies on to tell the question from its supporting detail.

```html
<!-- good: question in the heading, detail below -->
<h3>How satisfied were you with our service?</h3>
<p>Think about your most recent visit. 1 = very unsatisfied, 5 = very satisfied.</p>

<!-- bad: the whole prompt jammed into one heading -->
<h3>How satisfied were you with our service? Think about your most recent visit. 1 = very unsatisfied, 5 = very satisfied.</h3>
```

It is **rich text**, not a plain string: it can contain headings, styled runs, lists, tables, images, quotes, links, collapsible sections, two-column layouts, and references to other fields. A description is represented as an **HTML string** — the canonical representation that gets parsed into the editor and rendered to a respondent.

```html
<h3>Where should we reach you?</h3>
<p>We'll only use this to send your <strong>receipt</strong>.</p>
```

If a field has no description, treat the value as "no description" — an empty description carries no meaningful content.

## You author with HTML, not markdown

When you set a description with `form_apply_edits` (the `descriptionHtml` field), provide **HTML**, not markdown. Walla parses that HTML against the editor's schema and stores the result. Two consequences follow:

- **Structure comes from tags, not whitespace.** Separate blocks with `<p>…</p>`, `<h3>…</h3>`, `<ul>…</ul>` — not line breaks. A run of text with no block tags becomes a single paragraph, and newlines inside the HTML are insignificant whitespace. Do **not** use `&nbsp;` to fake spacing or indentation — space with block tags, not entities.
- **Entities only where HTML needs them.** Because this is HTML, `&amp;`, `&lt;`, `&gt;` decode to `&`, `<`, `>` — so use them only when the literal character would otherwise be ambiguous markup. For ordinary text just type the real character (`Q&A`, not `Q&amp;A`).
- **Out-of-schema markup is dropped, never corrupted.** Anything the schema below does not recognise (`<script>`, `<style>`, arbitrary classes, unknown tags) is silently discarded. The worst case is feature loss, never a broken description.

## Structural rule: descriptions start with a heading

A description is **required to begin with a heading**, followed by any number of block elements. This is the stored document's content schema — `heading (block | columns)*` — not a style preference. New headings default to level 3 (`<h3>`).

Always lead `descriptionHtml` with a heading (`<h1>`–`<h6>`). If you open with anything else, the schema forces a heading by **promoting your first block's text into it** — a leading `<p>` becomes an `<h3>`, a leading list loses its first item to the heading, and a leading quote or figure collapses into heading text. Your opening block is silently converted, not preserved, so always write an explicit leading heading.

## Supported formatting

### Inline (marks on text)

| Capability | HTML |
|---|---|
| Bold | `<strong>` |
| Italic | `<em>` |
| Underline | `<u>` |
| Strikethrough | `<s>` |
| Inline code | `<code>` |
| Subscript / superscript | `<sub>` / `<sup>` |
| Highlight | `<mark>` |
| Text color / font family / font size | inline-styled `<span>`: `style="color: #2563eb"`, `style="font-family: Georgia"`, `style="font-size: 18px"` |
| Link | `<a href="…">` (rendered with `class="link"`; `javascript:` URLs are rejected) |

### Block content

| Capability | HTML |
|---|---|
| Heading | `<h1>`–`<h6>` (default `<h3>`); the content must start with one |
| Paragraph | `<p>` |
| Bullet / numbered list | `<ul>` / `<ol>` with `<li>`; nesting allowed |
| Code block | `<pre><code>…</code></pre>` (no syntax highlighting) |
| Table | `<table><tbody><tr><th>…</th><td>…</td></tr></tbody></table>` |
| Horizontal rule | `<hr>` |
| Text alignment | `style="text-align: center"` on a heading or `<p>` (left / center / right / justify) |

### Structural blocks (exact markup required)

These nodes parse **only** from their exact tag and attributes — ordinary HTML equivalents (for example a bare `<blockquote>`) will not attach and are dropped. Copy these shapes.

**Image** — a block image with a width (percentage) and alignment:

```html
<img src="https://example.com/photo.png" alt="A short caption" data-width="60%" data-align="center">
```

Use `data-width` and `data-align`, not `width`/`align`. `data-align` is `left` | `center` | `right`.

**Two-column layout** — exactly two columns, each holding block content:

```html
<div data-type="columns">
  <div data-type="column" data-position="left"><p>Left column.</p></div>
  <div data-type="column" data-position="right"><p>Right column.</p></div>
</div>
```

**Collapsible section** — a toggle that is open or closed by default:

```html
<div data-type="collapsible" data-open="true"><h3>More detail</h3><p>Hidden until expanded.</p></div>
```

`data-open` is `true` | `false`.

**Blockquote** — a quote with an optional caption. It must be wrapped in the figure; a bare `<blockquote>` is dropped:

```html
<figure data-type="blockquoteFigure">
  <blockquote><p>Quoted text.</p></blockquote>
  <figcaption>Attribution</figcaption>
</figure>
```

**Task (checkbox) list** — checkable items:

```html
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Done</p></li>
  <li data-type="taskItem" data-checked="false"><p>Still to do</p></li>
</ul>
```

There is a hard ceiling of **50,000 characters** per description.

## Field references ("piping")

A description can embed a **reference to another field** in the same form. At render time, the respondent's live answer to that field is substituted into the text, falling back to a blank placeholder if unanswered.

A reference is a `<field-mention>` element keyed by the referenced field's **id**:

```html
<p>Thanks, <field-mention data-id="fld_name123"></field-mention>!</p>
```

Key facts when producing references:

- The reference is anchored to a field **id**, not its label. Read the form first to obtain a real id; never invent one.
- Only fields whose answer is a **string or a list of strings** can be referenced. Fields with other answer shapes cannot be piped.
- A reference only resolves **within the same form** — it does not survive being copied to another form, and reusable field templates strip references out.

## Authoring checklist

1. Provide the description as HTML in `descriptionHtml`. Structure it with tags, not newlines.
2. Start with a heading (`<h1>`–`<h6>`).
3. Use only the capabilities above; unknown markup is dropped.
4. To reference another field, use `<field-mention data-id="…">` with a real field id, and only for string or list fields.
5. Stay within the 50,000-character limit.

## Related references

- Field types, answer shapes, and which fields can be piped: see the field-type and form-structure references.
- The discovery chain and the error contract are described in the server instructions.
