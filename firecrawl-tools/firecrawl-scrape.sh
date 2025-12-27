#!/bin/bash
# Scrape a URL and return markdown content
# Usage: firecrawl-scrape.sh <url>

set -e
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
source "$SCRIPT_DIR/.env"

URL="$1"
if [ -z "$URL" ]; then
  echo "Usage: firecrawl-scrape.sh <url>"
  exit 1
fi

curl -s https://api.firecrawl.dev/v1/scrape -X POST \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\", \"formats\": [\"markdown\"]}" | jq -r '.data.markdown'
