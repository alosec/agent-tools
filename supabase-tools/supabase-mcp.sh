#!/bin/bash
# Supabase MCP CLI wrapper
# Interact with Supabase via the Supabase MCP server
#
# Usage:
#   supabase-mcp.sh projects                     # List all projects
#   supabase-mcp.sh project <ref>                # Get project details
#   supabase-mcp.sh tables <ref>                 # List tables in project
#   supabase-mcp.sh sql <ref> "SELECT..."        # Execute SQL query
#   supabase-mcp.sh migrations <ref>             # List migrations
#   supabase-mcp.sh migrate <ref> "SQL..."       # Apply migration
#   supabase-mcp.sh policies <ref>               # List RLS policies
#   supabase-mcp.sh logs <ref> [service]         # Get logs (api, postgres, edge)
#   supabase-mcp.sh orgs                         # List organizations
#   supabase-mcp.sh extensions <ref>             # List extensions
#   supabase-mcp.sh types <ref>                  # Generate TypeScript types
#   supabase-mcp.sh docs "query"                 # Search Supabase docs
#
# Setup:
#   1. Copy .env.example to .env
#   2. Add your SUPABASE_ACCESS_TOKEN (from supabase.com/dashboard/account/tokens)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env from script directory
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

# Validate required config
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN not set" >&2
    echo "Copy .env.example to .env and add your token" >&2
    echo "Get token from: https://supabase.com/dashboard/account/tokens" >&2
    exit 1
fi

# Helper to escape JSON string
json_escape() {
    python3 -c "import json,sys; print(json.dumps(sys.stdin.read())[1:-1])"
}

# Build request based on command
case "$1" in
    projects|list-projects)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_projects","arguments":{}},"id":1}'
        ;;
    
    project|get-project)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh project <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_project","arguments":{"id":"'"$ref"'"}},"id":1}'
        ;;
    
    tables|list-tables)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh tables <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_tables","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    sql|query|execute)
        ref="$2"
        query="$3"
        if [ -z "$ref" ] || [ -z "$query" ]; then
            echo "Usage: supabase-mcp.sh sql <project_ref> \"SELECT...\"" >&2
            exit 1
        fi
        escaped_query=$(echo "$query" | json_escape)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"execute_sql","arguments":{"project_id":"'"$ref"'","query":"'"$escaped_query"'"}},"id":1}'
        ;;
    
    migrations|list-migrations)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh migrations <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_migrations","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    migrate|apply-migration)
        ref="$2"
        name="$3"
        sql="$4"
        if [ -z "$ref" ] || [ -z "$name" ] || [ -z "$sql" ]; then
            echo "Usage: supabase-mcp.sh migrate <project_ref> <name> \"SQL...\"" >&2
            exit 1
        fi
        escaped_sql=$(echo "$sql" | json_escape)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"apply_migration","arguments":{"project_id":"'"$ref"'","name":"'"$name"'","query":"'"$escaped_sql"'"}},"id":1}'
        ;;
    
    policies)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh policies <project_ref>" >&2
            exit 1
        fi
        # Use execute_sql to query pg_policies
        query="SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname"
        escaped_query=$(echo "$query" | json_escape)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"execute_sql","arguments":{"project_id":"'"$ref"'","query":"'"$escaped_query"'"}},"id":1}'
        ;;
    
    logs)
        ref="$2"
        service="${3:-api}"  # Default to api logs
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh logs <project_ref> [service]" >&2
            echo "Services: api, postgres, edge, auth, storage, realtime" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_logs","arguments":{"project_id":"'"$ref"'","service":"'"$service"'"}},"id":1}'
        ;;
    
    orgs|organizations)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_organizations","arguments":{}},"id":1}'
        ;;
    
    extensions|list-extensions)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh extensions <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_extensions","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    types|typescript)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh types <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"generate_typescript_types","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    docs|search-docs)
        query="$2"
        if [ -z "$query" ]; then
            echo "Usage: supabase-mcp.sh docs \"search query\"" >&2
            exit 1
        fi
        # GraphQL query for docs search
        gql_query='{ search(query: \"'"$query"'\") { title href content } }'
        escaped_gql=$(echo "$gql_query" | json_escape)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_docs","arguments":{"query":"'"$escaped_gql"'"}},"id":1}'
        ;;
    
    url)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh url <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_project_url","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    keys)
        ref="$2"
        if [ -z "$ref" ]; then
            echo "Usage: supabase-mcp.sh keys <project_ref>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_publishable_keys","arguments":{"project_id":"'"$ref"'"}},"id":1}'
        ;;
    
    raw)
        # Raw tool call - for advanced usage
        tool="$2"
        args="$3"
        if [ -z "$tool" ]; then
            echo "Usage: supabase-mcp.sh raw <tool_name> '{\"arg\":\"value\"}'" >&2
            exit 1
        fi
        args="${args:-{}}"
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"'"$tool"'","arguments":'"$args"'},"id":1}'
        ;;
    
    tools)
        # List available tools
        REQUEST='{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
        ;;
    
    *)
        echo "Supabase MCP CLI - Interact with Supabase via MCP server"
        echo ""
        echo "Usage:"
        echo "  supabase-mcp.sh projects                     # List all projects"
        echo "  supabase-mcp.sh project <ref>                # Get project details"
        echo "  supabase-mcp.sh tables <ref>                 # List tables in project"
        echo "  supabase-mcp.sh sql <ref> \"SELECT...\"        # Execute SQL query"
        echo "  supabase-mcp.sh migrations <ref>             # List migrations"
        echo "  supabase-mcp.sh migrate <ref> <name> \"SQL\"   # Apply migration"
        echo "  supabase-mcp.sh policies <ref>               # List RLS policies"
        echo "  supabase-mcp.sh logs <ref> [service]         # Get logs"
        echo "  supabase-mcp.sh orgs                         # List organizations"
        echo "  supabase-mcp.sh extensions <ref>             # List extensions"
        echo "  supabase-mcp.sh types <ref>                  # Generate TypeScript types"
        echo "  supabase-mcp.sh url <ref>                    # Get project URL"
        echo "  supabase-mcp.sh keys <ref>                   # Get publishable API keys"
        echo "  supabase-mcp.sh docs \"query\"                 # Search Supabase docs"
        echo "  supabase-mcp.sh tools                        # List all MCP tools"
        echo "  supabase-mcp.sh raw <tool> '{args}'          # Raw tool call"
        echo ""
        echo "Examples:"
        echo "  supabase-mcp.sh projects | jq '.result.content[0].text | fromjson'"
        echo "  supabase-mcp.sh sql abcd1234 \"SELECT * FROM profiles LIMIT 5\""
        echo "  supabase-mcp.sh policies abcd1234"
        echo "  supabase-mcp.sh logs abcd1234 postgres"
        echo ""
        echo "Setup: Copy .env.example to .env and add SUPABASE_ACCESS_TOKEN"
        echo "Get token: https://supabase.com/dashboard/account/tokens"
        exit 0
        ;;
esac

# Send request via MCP stdio transport
{
    echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"1.0"}},"id":0}'
    sleep 1
    echo "$REQUEST"
} | timeout 30 npx -y @supabase/mcp-server-supabase@latest --access-token "$SUPABASE_ACCESS_TOKEN" 2>/dev/null | grep '^{"jsonrpc"' | tail -1
