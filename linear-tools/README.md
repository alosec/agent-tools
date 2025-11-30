# Linear Tools

CLI tools for Linear API operations (documents, projects). Uses `LINEAR_API_TOKEN` environment variable.

## How to Invoke These Tools

**CRITICAL FOR AGENTS**: These are executable scripts in your PATH. When invoking via the Bash tool:

✓ CORRECT:
```bash
linear-docs-list.js
linear-project-create.js "My Project" --team <id>
```

✗ INCORRECT:
```bash
node linear-docs-list.js     # Don't use 'node' prefix
./linear-docs-list.js        # Don't use './' prefix
```

---

## Documents

### List Documents

```bash
linear-docs-list.js
linear-docs-list.js -n 50
linear-docs-list.js --project "My Project"
```

### Read Document

```bash
linear-docs-read.js <document-id>
```

### Create Document

```bash
linear-docs-create.js "Title" --team <team-id>
linear-docs-create.js "Title" --content "# Markdown" --team <team-id>
linear-docs-create.js "Title" --content-file ./doc.md --project <project-id>
linear-docs-create.js "Title" --issue <issue-id>
```

Must specify one parent: `--team`, `--project`, or `--issue`.

### Update Document

```bash
linear-docs-update.js <id> --title "New Title"
linear-docs-update.js <id> --content "# Updated content"
linear-docs-update.js <id> --content-file ./updated.md
```

### Delete Document

```bash
linear-docs-delete.js <document-id>
```

---

## Projects

### List Projects

```bash
linear-project-list.js
linear-project-list.js -n 10
linear-project-list.js --team <team-id>
linear-project-list.js --name "blog"
```

### Read Project

```bash
linear-project-read.js <project-id>
```

Returns full project details including members, teams, and associated issues.

### Create Project

```bash
linear-project-create.js "Project Name" --team <team-id>
linear-project-create.js "Q1 Launch" --team <id> --priority 2 --target 2025-03-31
linear-project-create.js "Blog" --team <id> --description "Personal blog project" --icon "📝"
```

**Required:** `--team <team-id>`

**Options:**
- `--description <text>` - Project description
- `--content <markdown>` - Project content (markdown)
- `--icon <emoji>` - Project icon
- `--color <hex>` - Project color (e.g., #ff0000)
- `--priority <0-4>` - Priority (0=none, 1=urgent, 2=high, 3=normal, 4=low)
- `--start <YYYY-MM-DD>` - Start date
- `--target <YYYY-MM-DD>` - Target date

### Update Project

```bash
linear-project-update.js <id> --name "New Name"
linear-project-update.js <id> --priority 1 --target 2025-03-31
linear-project-update.js <id> --description "Updated description" --color "#00ff00"
```

All options from create are available for update.

### Delete Project

```bash
linear-project-delete.js <project-id>
```

Moves project to trash.

---

## Output Format

All commands output JSON:

```json
{
  "id": "7eed5c01-...",
  "name": "alexgarciablog",
  "slugId": "c2ef4451a29c",
  "description": "",
  "icon": null,
  "color": "#bec2c8",
  "priority": 0,
  "startDate": null,
  "targetDate": null,
  "createdAt": "2025-11-30T08:24:01.507Z",
  "teams": { "nodes": [{ "id": "...", "name": "Abg-personal" }] }
}
```

---

## Favorites

### List Favorites

```bash
linear-favorite-list.js
linear-favorite-list.js --type project
linear-favorite-list.js --type folder
```

### Create Favorite

```bash
linear-favorite-create.js --project <id>
linear-favorite-create.js --issue <id>
linear-favorite-create.js --document <id>
linear-favorite-create.js --cycle <id>
linear-favorite-create.js --folder "My Folder"
linear-favorite-create.js --project <id> --parent <folderId>
```

### Delete Favorite

```bash
linear-favorite-delete.js <favoriteId>
```

Use `linear-favorite-list.js` to find favorite IDs.

---

## Setup

1. Set `LINEAR_API_TOKEN` environment variable
2. Add this directory to PATH or symlink scripts to a PATH directory
3. Run any command with `--help` for usage
