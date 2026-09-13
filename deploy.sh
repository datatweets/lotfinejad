#!/usr/bin/env bash
# Deploy lotfinejad.ir: build locally to catch errors, then commit + push
# to main. A GitHub Actions workflow does the actual build + publish to
# GitHub Pages once it sees the push — this script just gets you there
# and (by default) watches until that finishes.
#
# Usage:
#   ./deploy.sh                     commit any changes (default message), push, watch the deploy
#   ./deploy.sh "commit message"    same, with your own commit message
#   ./deploy.sh --no-watch          push and exit immediately, don't wait for Actions
set -euo pipefail

REPO="datatweets/lotfinejad"
SITE_URL="https://lotfinejad.ir"

cd "$(dirname "${BASH_SOURCE[0]}")"

watch=1
message=""
for arg in "$@"; do
  case "$arg" in
    --no-watch) watch=0 ;;
    *) message="$arg" ;;
  esac
done

echo "==> Building locally to catch errors before pushing…"
rm -rf public resources
if ! hugo --gc --minify > /tmp/lotfinejad-build.log 2>&1; then
  echo "✗ Local Hugo build failed — not pushing. Build output:"
  cat /tmp/lotfinejad-build.log
  exit 1
fi
rm -rf public resources
echo "✓ Build OK"

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  echo "⚠ You're on branch '$branch', not 'main'. This site only deploys from 'main'."
  read -r -p "Continue anyway? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  [ -z "$message" ] && message="Update site ($(date +'%Y-%m-%d %H:%M'))"
  git commit -q -m "$message"
  echo "✓ Committed: $message"
else
  echo "· No local changes to commit."
fi

git fetch -q origin main
if [ -z "$(git log origin/main..HEAD 2>/dev/null)" ]; then
  echo "· Nothing new to push — already up to date with origin/main."
  exit 0
fi

git push origin main
echo "✓ Pushed to origin/main"

if [ "$watch" -eq 0 ]; then
  echo "Not watching the deploy. Check progress: https://github.com/$REPO/actions"
  exit 0
fi

if ! command -v gh > /dev/null 2>&1 || ! command -v jq > /dev/null 2>&1; then
  echo "· gh/jq not available — can't watch the deploy. Check progress:"
  echo "  https://github.com/$REPO/actions"
  exit 0
fi

echo "==> Watching the deploy…"
sha=$(git rev-parse HEAD)
run=""
for _ in $(seq 1 30); do
  sleep 5
  run=$(gh run list --repo "$REPO" --limit 5 --json status,conclusion,headSha 2>/dev/null \
        | jq -r --arg sha "$sha" '.[] | select(.headSha == $sha)')
  [ -n "$run" ] && break
done

if [ -z "$run" ]; then
  echo "⚠ Could not find the Actions run yet. Check manually:"
  echo "  https://github.com/$REPO/actions"
  exit 0
fi

status=$(echo "$run" | jq -r '.status')
for _ in $(seq 1 60); do
  [ "$status" = "completed" ] && break
  sleep 10
  run=$(gh run list --repo "$REPO" --limit 5 --json status,conclusion,headSha \
        | jq -r --arg sha "$sha" '.[] | select(.headSha == $sha)')
  status=$(echo "$run" | jq -r '.status')
  echo "  … $status"
done

conclusion=$(echo "$run" | jq -r '.conclusion')
if [ "$status" != "completed" ]; then
  echo "⚠ Gave up waiting — it's still running. Check: https://github.com/$REPO/actions"
elif [ "$conclusion" = "success" ]; then
  echo "✓ Deployed — $SITE_URL"
else
  echo "✗ Deploy finished with conclusion: $conclusion"
  echo "  https://github.com/$REPO/actions"
  exit 1
fi
