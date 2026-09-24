#!/usr/bin/env bash

DIST=./dist

echo "> Cleaning dist (before build)"
shx rm -rf $DIST
shx mkdir -p $DIST

echo "> Building next"

# Page-data workers inherit NODE_OPTIONS; a high heap per process × many workers can OOM
# 16GB builders (e.g. Vercel). Override with BUILD_NODE_MAX_OLD_SPACE_SIZE / NEXT_BUILD_CPUS.
if [ -z "${BUILD_NODE_MAX_OLD_SPACE_SIZE:-}" ]; then
  if [ -n "${VERCEL:-}" ] || [ -n "${CI:-}" ]; then
    BUILD_NODE_MAX_OLD_SPACE_SIZE=5120
  else
    BUILD_NODE_MAX_OLD_SPACE_SIZE=8192
  fi
fi

echo "> Node heap limit (max-old-space-size): ${BUILD_NODE_MAX_OLD_SPACE_SIZE}MB"

NODE_OPTIONS="--max-old-space-size=${BUILD_NODE_MAX_OLD_SPACE_SIZE}" next build --webpack || exit 1

if [ ! -f .next/routes-manifest.json ]; then
  echo "next build did not write .next/routes-manifest.json" >&2
  exit 1
fi

echo "> Copying .next to dist folder"

# We have to remove the cache to prevent issues with heroku slug size: https://github.com/opencollective/opencollective-frontend/pull/8661
# Check env to not remove cache on CI (it's cached)
if [ "$PRESERVE_NEXT_CACHE" != "true" ]; then
  echo "Removing .next/cache"
  shx rm -rf .next/cache
fi

shx cp -R .next $DIST
