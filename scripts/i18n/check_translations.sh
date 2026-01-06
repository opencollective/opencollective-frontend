#!/usr/bin/env bash

# Ensure we are on root folder
cd -- "$(dirname $0)/.."

# Build language files
npm run build:langs || exit 1

# Check if language files changed
CHANGED=$(git status --porcelain | grep lang)
if [ -n "${CHANGED}" ] ; then
  echo "Language files are not up to date, Please run 'npm run build:langs'"
  echo "-------- FILES --------"
  git status
  echo "-------- DIFF --------"
  git --no-pager diff
  exit 1
else
  echo "Eveything's up to date 🌞️"
fi
