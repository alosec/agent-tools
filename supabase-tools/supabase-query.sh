#!/bin/bash
# Query Supabase via Management API
# Usage: supabase-query.sh <project-ref> <sql>

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

PROJECT_REF="$1"
SQL="$2"

if [ -z "$PROJECT_REF" ] || [ -z "$SQL" ]; then
  echo "Usage: supabase-query.sh <project-ref> \"<sql>\""
  exit 1
fi

# Use the Supabase Management API to execute SQL
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$SQL\"}"
