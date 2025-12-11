#!/bin/bash
# Slack MCP CLI wrapper
# Interact with Slack via the Slack MCP server
#
# Usage:
#   slack-mcp.sh channels                    # List channels
#   slack-mcp.sh history <channel> [limit]   # Get channel history  
#   slack-mcp.sh search <query>              # Search messages
#   slack-mcp.sh send <channel> <message>    # Send message to channel
#   slack-mcp.sh send <channel> -f <file>    # Send message from file
#
# Setup:
#   1. Copy .env.example to .env
#   2. Add your SLACK_MCP_XOXP_TOKEN
#   3. Ensure slack-mcp-server binary is in PATH or set SLACK_MCP_SERVER

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env from script directory
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

# Validate required config
if [ -z "$SLACK_MCP_XOXP_TOKEN" ]; then
    echo "Error: SLACK_MCP_XOXP_TOKEN not set" >&2
    echo "Copy .env.example to .env and add your token" >&2
    exit 1
fi

# Find MCP server binary
if [ -z "$SLACK_MCP_SERVER" ]; then
    SLACK_MCP_SERVER=$(which slack-mcp-server 2>/dev/null || echo "")
fi
if [ -z "$SLACK_MCP_SERVER" ] || [ ! -x "$SLACK_MCP_SERVER" ]; then
    echo "Error: slack-mcp-server not found" >&2
    echo "Set SLACK_MCP_SERVER in .env or add to PATH" >&2
    exit 1
fi

# Set cache defaults if not specified
export SLACK_MCP_CHANNELS_CACHE="${SLACK_MCP_CHANNELS_CACHE:-$SCRIPT_DIR/.channels_cache_v2.json}"
export SLACK_MCP_USERS_CACHE="${SLACK_MCP_USERS_CACHE:-$SCRIPT_DIR/.users_cache.json}"

# Helper to escape JSON string
json_escape() {
    python3 -c "import json,sys; print(json.dumps(sys.stdin.read())[1:-1])"
}

# Build request based on command
case "$1" in
    channels)
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"channels_list","arguments":{"channel_types":"public_channel,private_channel,im,mpim","limit":100}},"id":1}'
        ;;
    
    history)
        channel="${2:-#general}"
        limit="${3:-1d}"
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conversations_history","arguments":{"channel_id":"'"$channel"'","limit":"'"$limit"'"}},"id":1}'
        ;;
    
    search)
        query="$2"
        if [ -z "$query" ]; then
            echo "Usage: slack-mcp.sh search <query>" >&2
            exit 1
        fi
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conversations_search_messages","arguments":{"search_query":"'"$query"'","limit":20}},"id":1}'
        ;;
    
    send|post)
        channel="$2"
        if [ -z "$channel" ]; then
            echo "Usage: slack-mcp.sh send <channel> <message>" >&2
            echo "       slack-mcp.sh send <channel> -f <file>" >&2
            exit 1
        fi
        
        # Check if reading from file
        if [ "$3" = "-f" ]; then
            if [ -z "$4" ] || [ ! -f "$4" ]; then
                echo "Error: File not found: $4" >&2
                exit 1
            fi
            message=$(cat "$4" | json_escape)
        else
            shift 2
            if [ -z "$1" ]; then
                echo "Usage: slack-mcp.sh send <channel> <message>" >&2
                exit 1
            fi
            message=$(echo "$*" | json_escape)
        fi
        
        REQUEST='{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conversations_add_message","arguments":{"channel_id":"'"$channel"'","payload":"'"$message"'","content_type":"text/markdown"}},"id":1}'
        ;;
    
    *)
        echo "Slack MCP CLI - Interact with Slack via MCP server"
        echo ""
        echo "Usage:"
        echo "  slack-mcp.sh channels                    # List channels"
        echo "  slack-mcp.sh history <channel> [limit]   # Get channel history"
        echo "  slack-mcp.sh search <query>              # Search messages"
        echo "  slack-mcp.sh send <channel> <message>    # Send message to channel"
        echo "  slack-mcp.sh send <channel> -f <file>    # Send message from file"
        echo ""
        echo "Examples:"
        echo "  slack-mcp.sh history '#general' 10       # Last 10 messages"
        echo "  slack-mcp.sh history '@username' 1d      # DMs from last day"
        echo "  slack-mcp.sh search 'deployment'         # Search messages"
        echo "  slack-mcp.sh send '#stand-up' 'Hello!'   # Post to #stand-up"
        echo "  slack-mcp.sh send '#general' -f msg.txt  # Post from file"
        echo ""
        echo "Limits: 1d (day), 1w (week), 30d (30 days), or number"
        echo ""
        echo "Setup: Copy .env.example to .env and add SLACK_MCP_XOXP_TOKEN"
        exit 0
        ;;
esac

# Write request to temp file
REQFILE=$(mktemp)
echo "$REQUEST" > "$REQFILE"
trap "rm -f $REQFILE" EXIT

# Send request via MCP stdio transport
{
    echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"1.0"}},"id":0}'
    sleep 2  # Wait for cache to load
    cat "$REQFILE"
} | timeout 30 "$SLACK_MCP_SERVER" -t stdio 2>/dev/null | grep '^{"jsonrpc"' | tail -1
