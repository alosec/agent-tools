#!/bin/bash
# Insert events from JSON file into Supabase, avoiding duplicates
# Usage: insert-events.sh <json-file> [--dry-run]
#
# Expects JSON array of objects with: title, date, time, description, event_type, ticket_url, venue

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../supabase-tools/.env"

JSON_FILE="$1"
DRY_RUN="${2:-}"
PROJECT_REF="jhqgctrqhvytujcvitym"

if [ -z "$JSON_FILE" ]; then
  echo "Usage: insert-events.sh <json-file> [--dry-run]"
  exit 1
fi

# Get venue_id mappings
get_venue_id() {
  local venue="$1"
  case "$venue" in
    "Moody Center") echo "86" ;;
    "Q2 Stadium") echo "17" ;;
    "ACL Live"|"ACL Live at The Moody Theater") echo "6" ;;
    "Moody Amphitheater"|"Moody Amphitheater at Waterloo Park") echo "5" ;;
    "Stubb's") echo "NULL" ;;  # Need to add to venues table
    "Mohawk") echo "85" ;;
    *) echo "NULL" ;;
  esac
}

# Calculate end_time (2 hours after start for sports, 3 for concerts)
calc_end_time() {
  local time="$1"
  local event_type="$2"
  
  if [ -z "$time" ] || [ "$time" = "null" ]; then
    echo "NULL"
    return
  fi
  
  # Simple: just add 2-3 hours to the time string
  # This is hacky but works for display
  local hours=2
  if [[ "$event_type" =~ [Cc]oncert|[Mm]usic ]]; then
    hours=3
  fi
  
  # For now just return NULL - proper time math is complex in bash
  echo "NULL"
}

# Process each event
inserted=0
skipped=0

jq -c '.[]' "$JSON_FILE" | while read -r event; do
  title=$(echo "$event" | jq -r '.title // empty' | sed "s/'/''/g")
  date=$(echo "$event" | jq -r '.date // empty')
  time=$(echo "$event" | jq -r '.time // empty')
  description=$(echo "$event" | jq -r '.description // empty' | sed "s/'/''/g")
  event_type=$(echo "$event" | jq -r '.event_type // empty')
  ticket_url=$(echo "$event" | jq -r '.ticket_url // empty')
  venue=$(echo "$event" | jq -r '.venue // empty')
  
  # Skip if missing required fields
  if [ -z "$title" ] || [ -z "$date" ] || [ -z "$venue" ]; then
    echo "SKIP: Missing required fields - $title"
    continue
  fi
  
  # Skip past events
  if [[ "$date" < "$(date +%Y-%m-%d)" ]]; then
    echo "SKIP: Past event - $title on $date"
    continue
  fi
  
  venue_id=$(get_venue_id "$venue")
  
  # Check if event already exists
  exists=$("$SCRIPT_DIR/../supabase-tools/supabase-query.sh" "$PROJECT_REF" \
    "SELECT COUNT(*) as c FROM events WHERE title ILIKE '%${title:0:30}%' AND date = '$date'" 2>/dev/null | jq -r '.[0].c')
  
  if [ "$exists" != "0" ] && [ -n "$exists" ]; then
    echo "SKIP: Already exists - $title on $date"
    ((skipped++)) || true
    continue
  fi
  
  # Build INSERT
  sql="INSERT INTO events (title, date, time, venue, venue_id, description, event_type, ticket_url, created_at, updated_at) VALUES ('$title', '$date', $([ -n "$time" ] && echo "'$time'" || echo "NULL"), '$venue', $venue_id, $([ -n "$description" ] && echo "'$description'" || echo "NULL"), $([ -n "$event_type" ] && echo "'$event_type'" || echo "NULL"), $([ -n "$ticket_url" ] && echo "'$ticket_url'" || echo "NULL"), NOW(), NOW())"
  
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "DRY RUN: Would insert - $title on $date at $venue"
  else
    echo "INSERT: $title on $date at $venue"
    "$SCRIPT_DIR/../supabase-tools/supabase-query.sh" "$PROJECT_REF" "$sql" >/dev/null 2>&1 || echo "  ERROR inserting"
    ((inserted++)) || true
  fi
done

echo ""
echo "Done. Inserted: $inserted, Skipped: $skipped"
