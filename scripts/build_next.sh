#!/usr/bin/env bash

DIST=./dist

echo "> Copying pdfjs assets"
cross-env scripts/copy_pdf_assets.sh

echo "> Cleaning dist (before build)"
shx rm -rf $DIST
shx mkdir -p $DIST

echo "> Building next"

if [ "$USE_WEBPACK" = "1" ] || [ "$USE_WEBPACK" = "true" ]; then
  echo "Using webpack build"
  NODE_OPTIONS="--max-old-space-size=8192" next build --webpack || exit 1
else
  echo "Using Turbopack build"
  NODE_OPTIONS="--max-old-space-size=8192" next build || exit 1
fi

echo "> Copying .next to dist folder"

# We have to remove the cache to prevent issues with heroku slug size: https://github.com/opencollective/opencollective-frontend/pull/8661
# Check env to not remove cache on CI (it's cached)
if [ "$PRESERVE_NEXT_CACHE" != "true" ]; then
  echo "Removing .next/cache"
  shx rm -rf .next/cache
fi

shx cp -R .next $DIST
