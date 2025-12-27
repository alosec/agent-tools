# Slack Tools

Use the Slack API directly. No wrapper scripts needed.

## Setup

Get a User OAuth Token (`xoxp-...`) from your Slack app with appropriate scopes.

## API Reference

```bash
# List channels
curl -s "https://slack.com/api/conversations.list" \
  -H "Authorization: Bearer $SLACK_TOKEN" | jq '.channels[] | {id, name}'

# Get channel history
curl -s "https://slack.com/api/conversations.history?channel=CHANNEL_ID&limit=20" \
  -H "Authorization: Bearer $SLACK_TOKEN" | jq '.messages[]'

# Search messages
curl -s "https://slack.com/api/search.messages?query=QUERY" \
  -H "Authorization: Bearer $SLACK_TOKEN" | jq '.messages.matches[]'

# Post message
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel": "CHANNEL_ID", "text": "Hello"}'

# Get user info
curl -s "https://slack.com/api/users.info?user=USER_ID" \
  -H "Authorization: Bearer $SLACK_TOKEN" | jq '.user'
```

## Common Scopes

- `channels:read`, `channels:history` - Public channels
- `groups:read`, `groups:history` - Private channels
- `im:read`, `im:history` - DMs
- `users:read` - User info
- `search:read` - Search messages
- `chat:write` - Post messages
