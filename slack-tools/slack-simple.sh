#!/bin/bash
# Simple Slack CLI - direct API, no MCP server, no cache bullshit
#
# Usage:
#   slack-simple.sh channels                     # List channels
#   slack-simple.sh history <channel> [limit]    # Get channel history
#   slack-simple.sh send <channel> <message>     # Send message
#   slack-simple.sh search <query>               # Search messages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load token from .env
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

TOKEN="${SLACK_MCP_XOXP_TOKEN:-$SLACK_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "Error: No token found. Set SLACK_MCP_XOXP_TOKEN in .env" >&2
    exit 1
fi

API="https://slack.com/api"

# Helper: make API call
slack_api() {
    local endpoint="$1"
    shift
    curl -s -H "Authorization: Bearer $TOKEN" "$API/$endpoint" "$@"
}

# Helper: resolve channel name to ID
resolve_channel() {
    local input="$1"
    # Strip # if present
    input="${input#\#}"
    
    # If it looks like an ID already, return it
    if [[ "$input" =~ ^C[A-Z0-9]+$ ]]; then
        echo "$input"
        return
    fi
    
    # Look up by name
    slack_api "conversations.list?limit=200" | jq -r ".channels[] | select(.name==\"$input\") | .id"
}

case "${1:-help}" in
    channels)
        slack_api "conversations.list?limit=200" | jq -r '.channels[] | "\(.id)\t\(.name)\t\(.num_members // 0) members"' | column -t -s$'\t'
        ;;
    
    history)
        channel=$(resolve_channel "${2:?channel required}")
        limit="${3:-20}"
        slack_api "conversations.history?channel=$channel&limit=$limit" | jq -r '.messages[] | "\(.user // .bot_id)\t\(.text)"' | head -"$limit"
        ;;
    
    send)
        channel=$(resolve_channel "${2:?channel required}")
        message="${3:?message required}"
        slack_api "chat.postMessage" \
            -H "Content-Type: application/json" \
            -d "{\"channel\":\"$channel\",\"text\":\"$message\"}" | jq '{ok, ts, channel}'
        ;;
    
    search)
        query="${2:?query required}"
        slack_api "search.messages" \
            -G --data-urlencode "query=$query" | jq -r '.messages.matches[:10][] | "\(.channel.name)\t\(.username)\t\(.text)"'
        ;;
    
    help|*)
        echo "Usage: slack-simple.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  channels                    List all channels"
        echo "  history <channel> [limit]   Get channel history (default 20)"
        echo "  send <channel> <message>    Send message to channel"
        echo "  search <query>              Search messages"
        ;;
esac
