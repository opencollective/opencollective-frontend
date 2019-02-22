#!/bin/bash
# This script only runs on circleci, just before the e2e tests
# first version cfr. https://discuss.circleci.com/t/add-ability-to-cache-apt-get-programs/598/6

cd ~

API_TARBALL_URL="https://codeload.github.com/opencollective/opencollective-api/tar.gz/";
if curl -s --head  --request GET "${API_TARBALL_URL}${CIRCLE_BRANCH}" | grep "200" > /dev/null
then
  BRANCH=$CIRCLE_BRANCH;
else
  BRANCH="master";
fi

# If we already have an archive of the branch locally (in ~/cache)
# Then we check to see if the size matches the online version
# If they do, we proceed to start the api server
# Otherwise we remove the local cache and install latest version of the branch

TARBALL_SIZE=$(curl -s --head  --request GET "${API_TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")

if [ ! $TARBALL_SIZE ]; then
  # First request doesn't always provide the content length for some reason (it's probably added by their caching layer)
  TARBALL_SIZE=$(curl -s --head  --request GET "${API_TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")
fi

ARCHIVE="${BRANCH//\//-}.tgz"

if [ -e $ARCHIVE ];
then
  LSIZE=$(wc -c $ARCHIVE | sed -E "s/ ?([0-9]+).*/\1/")
  test $TARBALL_SIZE = $LSIZE && echo "Size matches $ARCHIVE (${TARBALL_SIZE}:${LSIZE})" || (echo "> Removing old $ARCHIVE (size doesn't match: ${TARBALL_SIZE}:${LSIZE})"; rm $ARCHIVE; echo "File removed";)
fi

if [ ! -e $ARCHIVE ];
then
  echo "> Downloading tarball ${API_TARBALL_URL}${BRANCH}"
  curl  "${API_TARBALL_URL}${BRANCH}" -o $ARCHIVE
  echo "> Extracting $ARCHIVE"
  tar -xzf $ARCHIVE
  if [ -d "api" ]; then
    rm -rf api
  fi
  mv "opencollective-api-${BRANCH//\//-}" api
fi
