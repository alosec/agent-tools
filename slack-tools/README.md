# Slack MCP CLI Tools

CLI wrapper for reading Slack messages via the [Slack MCP Server](https://github.com/korotovsky/slack-mcp-server).

## Setup

1. **Get the Slack MCP server binary:**
   ```bash
   # Build from source or download release
   git clone https://github.com/korotovsky/slack-mcp-server
   cd slack-mcp-server
   go build -o slack-mcp-server ./cmd/slack-mcp-server
   sudo mv slack-mcp-server /usr/local/bin/
   ```

2. **Get a Slack token** (choose one method):
   
   **Option A: User OAuth (recommended)**
   - Create app at api.slack.com/apps
   - Add user scopes: `channels:history`, `channels:read`, `groups:history`, `groups:read`, `im:history`, `im:read`, `mpim:history`, `mpim:read`, `users:read`, `search:read`
   - Install to workspace, copy User OAuth Token (`xoxp-...`)

   **Option B: Browser tokens (stealth mode)**
   - Extract `xoxc` from browser localStorage
   - Extract `xoxd` from browser cookies

3. **Configure:**
   ```bash
   cp .env.example .env
   # Edit .env with your token
   chmod 600 .env
   ```

## Usage

```bash
# List all channels
./slack-mcp.sh channels

# Get channel history
./slack-mcp.sh history '#general'           # Last day (default)
./slack-mcp.sh history '#mew-product' 10    # Last 10 messages
./slack-mcp.sh history '@username' 1w       # DMs from last week

# Search messages
./slack-mcp.sh search 'deployment'
```

## Output

Returns JSON-RPC response. Parse with jq:

```bash
# Get just the CSV text content
./slack-mcp.sh channels | jq -r '.result.content[0].text'

# Pretty table
./slack-mcp.sh channels | jq -r '.result.content[0].text' | column -t -s,
```

## Limit formats

- `1d` - 1 day
- `1w` - 1 week  
- `30d` - 30 days
- `90d` - 90 days (free tier max)
- `10` - number of messages

## Files

- `.env` - Your configuration (gitignored)
- `.env.example` - Template
- `.channels_cache_v2.json` - Channel cache (gitignored)
- `.users_cache.json` - User cache (gitignored)

## Technical Details

Uses MCP (Model Context Protocol) JSON-RPC 2.0 over stdio transport.
The script handles the initialization handshake and waits for cache to load.
