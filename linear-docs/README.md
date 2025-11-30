# Linear Docs

CLI tools for Linear document CRUD operations. Uses `LINEAR_API_TOKEN` environment variable.

## How to Invoke These Tools

**CRITICAL FOR AGENTS**: These are executable scripts in your PATH. When invoking via the Bash tool:

✓ CORRECT:
```bash
linear-docs-list.js
linear-docs-read.js abc123
linear-docs-create.js "My Doc" --content "# Hello"
```

✗ INCORRECT:
```bash
node linear-docs-list.js     # Don't use 'node' prefix
./linear-docs-list.js        # Don't use './' prefix
```

## List Documents

```bash
linear-docs-list.js
linear-docs-list.js -n 50
linear-docs-list.js --project "My Project"
```

List documents with optional count limit and project filter.

## Read Document

```bash
linear-docs-read.js <document-id>
linear-docs-read.js abc123
```

Read a single document by ID. Returns full content.

## Create Document

```bash
linear-docs-create.js "Title" --team <team-id>
linear-docs-create.js "Title" --content "# Markdown content" --team <team-id>
linear-docs-create.js "Title" --content-file ./doc.md --project <project-id>
linear-docs-create.js "Title" --issue <issue-id>
```

Create a new document. Must specify one parent: `--team`, `--project`, or `--issue`. Content can be inline or read from a file.

## Update Document

```bash
linear-docs-update.js <id> --title "New Title"
linear-docs-update.js <id> --content "# Updated content"
linear-docs-update.js <id> --content-file ./updated.md
```

Update an existing document's title and/or content.

## Delete Document

```bash
linear-docs-delete.js <document-id>
```

Delete a document by ID.

## Output Format

All commands output JSON for easy parsing by agents:

```json
{
  "id": "abc123",
  "title": "My Document",
  "slugId": "my-document",
  "content": "# Hello\n\nWorld",
  "createdAt": "2025-11-30T07:00:00.000Z",
  "updatedAt": "2025-11-30T07:30:00.000Z",
  "project": { "id": "proj123", "name": "My Project" }
}
```
