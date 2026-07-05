#!/bin/bash
# Quick PR creation without gh CLI
# Usage: .hermes/scripts/create-pr.sh "PR title" "PR body"

set -e

TITLE="${1:-$(git log -1 --pretty=%s)}"
BODY="${2:-Auto-generated PR from Hermes}"
BRANCH=$(git branch --show-current)
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')

# Auto-detect base branch (master or main)
BASE_BRANCH=$(git remote show origin | grep "HEAD branch" | cut -d: -f2 | tr -d ' ')

# Get GitHub token from Hermes .env or git credentials
if [ -f "$HOME/.hermes/.env" ] && grep -q "^GITHUB_TOKEN=" "$HOME/.hermes/.env"; then
  GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" "$HOME/.hermes/.env" | head -1 | cut -d= -f2 | tr -d '\n\r')
elif grep -q "github.com" ~/.git-credentials 2>/dev/null; then
  GITHUB_TOKEN=$(grep "github.com" ~/.git-credentials 2>/dev/null | head -1 | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
else
  echo "Error: No GitHub token found in ~/.hermes/.env or ~/.git-credentials"
  exit 1
fi

echo "Creating PR: $TITLE"
echo "Branch: $BRANCH → $BASE_BRANCH"
echo "Repo: $OWNER_REPO"

# Push branch first
git push -u origin HEAD 2>&1 || true

# Create PR via GitHub API
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$OWNER_REPO/pulls \
  -d "{
    \"title\": \"$TITLE\",
    \"body\": \"$(echo "$BODY" | sed 's/"/\\"/g; s/$/\\n/g' | tr -d '\n' | sed 's/\\n$//')\",
    \"head\": \"$BRANCH\",
    \"base\": \"$BASE_BRANCH\"
  }")

# Extract PR number and URL
PR_NUMBER=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('number', 'ERROR'))" 2>/dev/null || echo "ERROR")
PR_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('html_url', 'ERROR'))" 2>/dev/null || echo "ERROR")

if [ "$PR_NUMBER" = "ERROR" ]; then
  echo "Failed to create PR:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
else
  echo "✅ PR #$PR_NUMBER created successfully!"
  echo "🔗 $PR_URL"
fi
