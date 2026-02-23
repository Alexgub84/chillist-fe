#!/bin/sh
set -e

URL="https://raw.githubusercontent.com/Alexgub84/chillist-be/main/docs/openapi.json"
OUTPUT="src/core/openapi.json"

TOKEN="${API_SPEC_TOKEN:-}"

if [ -z "$TOKEN" ] && [ -z "$CI" ]; then
  TOKEN="${GITHUB_TOKEN:-}"
fi

if [ -n "$TOKEN" ]; then
  curl -sf -H "Authorization: token $TOKEN" -o "$OUTPUT" "$URL"
else
  curl -sf -o "$OUTPUT" "$URL"
fi

echo "API spec fetched successfully"
