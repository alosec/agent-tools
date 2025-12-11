# Supabase MCP CLI

CLI wrapper for the Supabase MCP server. Query projects, execute SQL, inspect RLS policies, and more.

## Setup

```bash
cp .env.example .env
# Add your access token from https://supabase.com/dashboard/account/tokens
```

## Usage

```bash
# List projects
supabase-mcp.sh projects

# Get project details
supabase-mcp.sh project <ref>

# List tables
supabase-mcp.sh tables <ref>

# Execute SQL
supabase-mcp.sh sql <ref> "SELECT * FROM profiles LIMIT 5"

# List RLS policies
supabase-mcp.sh policies <ref>

# List migrations
supabase-mcp.sh migrations <ref>

# Apply migration
supabase-mcp.sh migrate <ref> "add_users_table" "CREATE TABLE users (...)"

# Get logs
supabase-mcp.sh logs <ref> postgres

# Generate TypeScript types
supabase-mcp.sh types <ref>

# Search docs
supabase-mcp.sh docs "RLS policies"

# List all available MCP tools
supabase-mcp.sh tools
```

## Parsing Output

Output is JSON-RPC. Extract the content with jq:

```bash
# Get project list as JSON
supabase-mcp.sh projects | jq -r '.result.content[0].text | fromjson'

# Get policy names
supabase-mcp.sh policies <ref> | jq -r '.result.content[0].text | fromjson | .[].policyname'
```

## Available Commands

| Command | Description |
|---------|-------------|
| `projects` | List all projects |
| `project <ref>` | Get project details |
| `tables <ref>` | List tables in project |
| `sql <ref> "query"` | Execute SQL query |
| `policies <ref>` | List RLS policies |
| `migrations <ref>` | List migrations |
| `migrate <ref> <name> "sql"` | Apply migration |
| `logs <ref> [service]` | Get logs (api, postgres, edge, auth) |
| `orgs` | List organizations |
| `extensions <ref>` | List extensions |
| `types <ref>` | Generate TypeScript types |
| `url <ref>` | Get project URL |
| `keys <ref>` | Get publishable API keys |
| `docs "query"` | Search Supabase docs |
| `tools` | List all MCP tools |
| `raw <tool> '{args}'` | Raw tool call |
