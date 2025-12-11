#!/bin/bash
# Extract events from a venue URL with predefined schema
# Usage: firecrawl-events.sh <url> [venue-name]
#
# Examples:
#   firecrawl-events.sh "https://moodycenteratx.com/events" "Moody Center"
#   firecrawl-events.sh "https://stubbsaustin.com/calendar"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

URL="$1"
VENUE="${2:-Unknown Venue}"

if [ -z "$URL" ]; then
  echo "Usage: firecrawl-events.sh <url> [venue-name]"
  exit 1
fi

SCHEMA='{
  "type": "object",
  "properties": {
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {"type": "string", "description": "Event name/title"},
          "date": {"type": "string", "description": "Event date in YYYY-MM-DD format if possible"},
          "time": {"type": "string", "description": "Event start time"},
          "description": {"type": "string", "description": "Brief description or subtitle"},
          "event_type": {"type": "string", "description": "Type: concert, sports, comedy, festival, etc"},
          "ticket_url": {"type": "string", "description": "URL to buy tickets"}
        }
      }
    }
  }
}'

RESULT=$(curl -s https://api.firecrawl.dev/v1/scrape -X POST \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$URL\",
    \"formats\": [\"extract\"],
    \"extract\": {
      \"schema\": $SCHEMA
    }
  }")

# Add venue to each event and output
echo "$RESULT" | jq --arg venue "$VENUE" '.data.extract.events | map(. + {venue: $venue})'
