---
name: documentation-writer
description: Write clear, comprehensive documentation including README files, API docs, user guides, changelogs, and code comments. Use this skill whenever the user asks to create, improve, or review any form of documentation — READMEs, API references, getting-started guides, troubleshooting pages, code comments, changelogs, or developer docs. Also trigger when the user mentions "docs", "documentation", "write a README", "API docs", "user guide", "docstring", or asks to document a codebase, library, or project. Even if the user just says "document this" or "add docs", use this skill.
---

# Documentation Writer

Create documentation that people actually read, understand, and follow.

## Workflow

1. **Identify the doc type** — README, API reference, user guide, code comments, changelog, or troubleshooting page.
2. **Identify the audience** — beginner, expert, internal team, or external users. Match depth and tone accordingly.
3. **Follow the appropriate template** below.
4. **Apply the writing principles** at the end of this file.
5. **Output as a file** — use `.md` for Markdown docs, or inline code comments where appropriate. For Word docs, follow the docx skill.

---

## Documentation Types

### 1. README Files

Structure:

```
# Project Name

Brief description (1-2 sentences)

## Features
- Key feature 1
- Key feature 2
- Key feature 3

## Quick Start

\```bash
# Install
npm install package

# Use
package do-thing
\```

## Usage
Detailed usage examples

## Configuration
Options and settings

## API
API reference (or link to full docs)

## Contributing
How to contribute

## License
MIT
```

Good README checklist:
- Clear project name and one-sentence description
- Installation in 3 commands or less
- Working copy-pasteable examples
- Common use cases covered
- Link to full docs if they exist

### 2. API Documentation

For each endpoint, document:

```
## Get User

`GET /api/users/{id}`

Retrieves user details by ID.

### Parameters

| Name   | Type   | In    | Required | Description      |
|--------|--------|-------|----------|------------------|
| id     | string | path  | Yes      | User ID          |
| fields | string | query | No       | Fields to return |

### Response

\```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2026-01-15T10:30:00Z"
}
\```

### Errors

| Code | Description    |
|------|----------------|
| 404  | User not found |
| 401  | Unauthorized   |
| 500  | Server error   |

### Example

\```bash
curl -X GET "https://api.example.com/users/123" \
  -H "Authorization: Bearer {token}"
\```
```

Every endpoint needs: HTTP method + path, description, parameters (path/query/body), response format, error codes, example request, and rate limits if applicable.

### 3. User Guides

Structure:

```
# Getting Started with X

## Prerequisites
- Requirement 1
- Requirement 2

## Step 1: First Action
Detailed explanation with context

## Step 2: Second Action
Continue with clear instructions

## Troubleshooting
Common problems and solutions

## Next Steps
- Advanced feature 1
- Advanced feature 2
```

Tips: start with the simplest path, one concept per section, use numbered steps, anticipate problems, include screenshots/diagrams when helpful.

### 4. Code Comments

**When to comment:** why (not what), complex logic, non-obvious decisions, workarounds, TODOs with context.

Good:
```python
# Using binary search because the list is sorted and we need O(log n)
# for real-time autocomplete. Linear search was too slow on lists > 10k items.
def find_item(sorted_list, target):
    ...

# Workaround for Safari bug with null values in localStorage
# See: https://bugs.webkit.org/show_bug?id=123456
def safe_store(key, value):
    ...

# TODO(john): Refactor into separate service when we add support
# for multiple payment providers. Currently only handles Stripe.
def process_payment(amount):
    ...
```

Bad (stating the obvious):
```python
# Increment counter
counter += 1

# Loop through items
for item in items:
    process(item)
```

### 5. Changelog

```
## v2.1.0 (2026-03-16)

### Added
- New `/api/batch` endpoint

### Changed
- `/api/users` now returns created_at timestamp

### Deprecated
- `/api/legacy-endpoint` — will be removed in v3.0
```

### 6. Troubleshooting Pages

```
## Troubleshooting

### Error: "Connection refused"
**Cause:** The server isn't running.
**Solution:** Start the server with `npm start`.

### Error: "Invalid API key"
**Cause:** Your API key is incorrect or expired.
**Solution:**
1. Check your API key in settings
2. Regenerate if needed
3. Update your configuration
```

---

## Writing Principles

### Audience First

| Audience       | Approach                    |
|----------------|-----------------------------|
| Beginner       | Explain concepts, full context |
| Expert         | Focus on specifics, skip basics |
| Internal team  | Use shorthand, link to internal refs |
| External users | Full context, no assumptions |

Example — Beginner: "First, install Node.js from nodejs.org". Expert: "Requires Node 18+".

### Show, Don't Tell

Bad: "The function processes data efficiently."
Good: "Processes 1M records in <2s on M1 MacBook. Benchmark: `test_process_benchmark.py`."

### Complete Examples

Always provide copy-pasteable examples with imports, initialization, usage, and error handling included — not just the happy path.

### Be Concise

Bad: "In order to use this function, you will need to first install the package."
Good: "Install the package first."

### Be Precise

Bad: "The function might return something."
Good: "Returns a `User` object or `null` if not found."

### Use Active Voice

Bad: "The data is processed by the system."
Good: "The system processes the data."

---

## Common Mistakes to Avoid

1. **Assumption dumping** — Don't say "Configure your environment variables." Instead, list every variable with where to find each value.
2. **Missing prerequisites** — Always state what needs to be installed before step 1.
3. **Outdated examples** — Mark deprecated code clearly, show current version.
4. **No error handling in examples** — Always include try/catch or error-check patterns.
5. **Skipping the "why"** — Explain decisions, not just instructions.

---

## Docstring Formats

**JSDoc:**
```javascript
/**
 * Calculate the sum of two numbers.
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 * @example
 * sum(2, 3) // returns 5
 */
```

**Python docstring:**
```python
def calculate_average(numbers: list[float]) -> float:
    """Calculate the average of a list of numbers.

    Args:
        numbers: List of numeric values

    Returns:
        The arithmetic mean of the numbers

    Raises:
        ValueError: If numbers list is empty

    Example:
        >>> calculate_average([1, 2, 3, 4, 5])
        3.0
    """
```

---

## Documentation Checklist

**README:** project name + description, install instructions, basic usage example, license, contact/support.

**API Docs:** all endpoints documented, request/response examples, error codes, authentication, rate limits.

**User Guide:** prerequisites clear, step-by-step instructions, screenshots/diagrams, troubleshooting, next steps.

**Code Comments:** why not what, complex logic explained, TODOs have context, no obvious comments.
