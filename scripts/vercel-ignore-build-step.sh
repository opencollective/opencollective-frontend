#!/bin/bash
# A script to tell Vercel whether it should ignore the deploy preview.

CURRENT_GIT_BRANCH=$(git branch --show-current)

echo "Current branch: $CURRENT_GIT_BRANCH"

if [[ $CURRENT_GIT_BRANCH == @(i18n/crowdin|ci/ignore-vercel) ]]; then
  echo "🛑 - Build cancelled"
  exit 0
else
  echo "✅ - Build can proceed"
  exit 1
fi
