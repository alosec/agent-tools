#!/bin/bash
# fat-provision.sh - Create and start a Fat Agent in seconds
# Usage: fat-provision.sh <name> [anthropic_key]

set -e

AGENT_NAME="${1:?Usage: fat-provision.sh <name> [anthropic_key]}"
ANTHROPIC_KEY="${2:-}"
OWNER_EMAIL="alexgarcia042@gmail.com"
USER_ID="290b966f-ab8d-4802-93f7-3ba309d8dad1"

# URLs
SUPABASE_URL="https://imtvwbmqiqygxtpdbaxz.supabase.co"
CONTAINER_URL="https://fat-agent-container.alexgarcia042.workers.dev"

# Load secrets
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY ~/.config/supabase/fat-agents.env | cut -d'=' -f2)
ENCRYPTION_SECRET=$(cat ~/.config/fat-agents/encryption-secret)

# If no anthropic key provided, use platform key
if [ -z "$ANTHROPIC_KEY" ]; then
  ANTHROPIC_KEY=$(grep ANTHROPIC_API_KEY ~/code/fat-agents/.env 2>/dev/null | cut -d'=' -f2 || echo "")
fi

echo "🚀 Provisioning agent: $AGENT_NAME"
START_TIME=$(date +%s.%N)

# 1. Generate IDs
AGENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
ALIAS=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')

# 2. Encrypt secrets
echo "🔐 Encrypting secrets..."
ENCRYPTED=$(node -e "
const crypto = require('crypto');
const key = Buffer.from('$ENCRYPTION_SECRET', 'base64');
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const secrets = JSON.stringify({
  slack_bot_token: '',
  slack_app_token: '',
  anthropic_key: '$ANTHROPIC_KEY'
});
let enc = cipher.update(secrets, 'utf8', 'base64');
enc += cipher.final('base64');
const tag = cipher.getAuthTag();
console.log(JSON.stringify({
  iv: iv.toString('base64'),
  ciphertext: enc + tag.toString('base64')
}));
")

# 3. Create agent record
echo "📝 Creating database record..."
curl -sf "$SUPABASE_URL/rest/v1/agents" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$AGENT_ID\",
    \"user_id\": \"$USER_ID\",
    \"name\": \"$AGENT_NAME\",
    \"agent_type\": \"mom\",
    \"agent_mode\": \"email\",
    \"encrypted_secrets\": $ENCRYPTED
  }" > /dev/null

# 4. Create email alias
echo "📧 Creating email alias..."
curl -sf "$SUPABASE_URL/rest/v1/agent_aliases" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"alias\": \"$ALIAS\",
    \"agent_id\": \"$AGENT_ID\",
    \"user_id\": \"$USER_ID\"
  }" > /dev/null

# 5. Start container
echo "🐳 Starting container..."
RESULT=$(curl -sf "$CONTAINER_URL/api/start" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$AGENT_ID\",
    \"agent_name\": \"$AGENT_NAME\",
    \"agent_type\": \"mom\",
    \"agent_mode\": \"email\",
    \"secrets\": {
      \"slack_bot_token\": \"\",
      \"slack_app_token\": \"\",
      \"anthropic_key\": \"$ANTHROPIC_KEY\"
    }
  }")

END_TIME=$(date +%s.%N)
ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)

echo ""
echo "✅ Agent provisioned in ${ELAPSED}s!"
echo ""
echo "   Name:  $AGENT_NAME"
echo "   ID:    $AGENT_ID"
echo "   Email: $ALIAS@tinyfat.com"
echo ""
echo "   Container: $(echo $RESULT | jq -r '.running // "starting..."')"
echo ""
echo "📬 Send an email to: $ALIAS@tinyfat.com"
