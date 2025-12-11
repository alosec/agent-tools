#!/bin/bash
# Search the web and optionally scrape results
# Usage: firecrawl-search.sh <query> [limit]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

QUERY="$1"
LIMIT="${2:-5}"

if [ -z "$QUERY" ]; then
  echo "Usage: firecrawl-search.sh <query> [limit]"
  echo ""
  echo "Examples:"
  echo "  firecrawl-search.sh 'best pizza austin'"
  echo "  firecrawl-search.sh 'climate change effects' 10"
  exit 1
fi

curl -s https://api.firecrawl.dev/v1/search -X POST \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$QUERY\", \"limit\": $LIMIT}" | jq '.data[] | {title, url, description}'
