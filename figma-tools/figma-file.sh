#!/bin/bash
# Fetch Figma file info and extract text content
# Usage: ./figma-file.sh <file-key> [node-id]

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

FILE_KEY="$1"
NODE_ID="$2"

if [ -z "$FILE_KEY" ]; then
    echo "Usage: ./figma-file.sh <file-key> [node-id]"
    echo "Example: ./figma-file.sh PM8XTEhCpvDPkq4ZINcB2d 784-5262"
    exit 1
fi

# Build URL
URL="https://api.figma.com/v1/files/$FILE_KEY"
if [ -n "$NODE_ID" ]; then
    URL="$URL/nodes?ids=$NODE_ID"
fi

echo "=== Figma File ==="
curl -s "$URL" \
    -H "X-Figma-Token: $FIGMA_TOKEN" | jq -r '
    if .name then
        "File: " + .name,
        "Updated: " + .lastModified,
        ""
    else . end'

echo "=== Text Content ==="
curl -s "$URL" \
    -H "X-Figma-Token: $FIGMA_TOKEN" | jq -r '
    # Recursive function to extract text from nodes
    def extract_text:
        if type == "object" then
            if .type == "TEXT" then
                .characters
            elif .children then
                .children | map(extract_text) | flatten | .[]
            elif .nodes then
                .nodes | to_entries | .[].value | extract_text
            elif .document then
                .document | extract_text
            else
                empty
            end
        elif type == "array" then
            .[] | extract_text
        else
            empty
        end;
    extract_text'
