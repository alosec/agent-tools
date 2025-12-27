#!/bin/bash
# Extract structured data from a URL using a JSON schema
# Usage: firecrawl-extract.sh <url> <schema-file|schema-json>
#
# Examples:
#   firecrawl-extract.sh "https://example.com/events" ./events-schema.json
#   firecrawl-extract.sh "https://example.com/events" '{"type":"object","properties":{"events":{"type":"array"}}}'

set -e
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
source "$SCRIPT_DIR/.env"

URL="$1"
SCHEMA="$2"

if [ -z "$URL" ] || [ -z "$SCHEMA" ]; then
  echo "Usage: firecrawl-extract.sh <url> <schema-file|schema-json>"
  echo ""
  echo "Examples:"
  echo "  firecrawl-extract.sh 'https://example.com/events' ./events-schema.json"
  echo "  firecrawl-extract.sh 'https://example.com/events' '{\"type\":\"object\"}'"
  exit 1
fi

# Check if schema is a file or inline JSON
if [ -f "$SCHEMA" ]; then
  SCHEMA_JSON=$(cat "$SCHEMA")
else
  SCHEMA_JSON="$SCHEMA"
fi

curl -s https://api.firecrawl.dev/v1/scrape -X POST \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$URL\",
    \"formats\": [\"extract\"],
    \"extract\": {
      \"schema\": $SCHEMA_JSON
    }
  }" | jq '.data.extract'
