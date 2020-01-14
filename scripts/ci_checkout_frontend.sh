#!/bin/bash

if [[ ! -z "${CIRCLE_BRANCH}" ]]; then
  CI_BRANCH="${CIRCLE_BRANCH}"
fi

if [[ ! -z "${GITHUB_REF}" ]]; then
  CI_BRANCH="${GITHUB_REF/refs\/heads\//}"
fi

CI_BRANCH=${CI_BRANCH:=master}

TARBALL_URL="https://codeload.github.com/opencollective/opencollective-frontend/tar.gz/"
echo "> Check ${TARBALL_URL}${CI_BRANCH}"
if curl -s --head --request GET "${TARBALL_URL}${CI_BRANCH}" | head -n 1 | grep "200" > /dev/null
then
  BRANCH=$CI_BRANCH;
else
  BRANCH="master";
fi

# If we already have an archive of the branch locally (in ~/cache)
# Then we check to see if the size matches the online version
# If they do, we proceed to start the api server
# Otherwise we remove the local cache and install latest version of the branch

TARBALL_SIZE=$(curl -s --head --request GET "${TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")

if [ ! $TARBALL_SIZE ]; then
  # First request doesn't always provide the content length for some reason (it's probably added by their caching layer)
  TARBALL_SIZE=$(curl -s --head --request GET "${TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")
fi

ARCHIVE="${BRANCH//\//-}.tgz"

if [ -e $ARCHIVE ];
then
  LSIZE=$(wc -c $ARCHIVE | sed -E "s/ ?([0-9]+).*/\1/")
  test $TARBALL_SIZE = $LSIZE && echo "Size matches $ARCHIVE (${TARBALL_SIZE}:${LSIZE})" || (echo "> Removing old $ARCHIVE (size doesn't match: ${TARBALL_SIZE}:${LSIZE})"; rm $ARCHIVE; echo "File removed";)
fi

if [ ! -e $ARCHIVE ];
then
  echo "> Downloading tarball ${TARBALL_URL}${BRANCH}"
  curl "${TARBALL_URL}${BRANCH}" -o $ARCHIVE
  echo "> Extracting $ARCHIVE"
  tar -xzf $ARCHIVE
  mkdir -p $FRONTEND_FOLDER
  rm -rf $FRONTEND_FOLDER
  mv "opencollective-frontend-${BRANCH//\//-}" $FRONTEND_FOLDER
  mv $ARCHIVE $FRONTEND_FOLDER/archive.tar.gz
fi
