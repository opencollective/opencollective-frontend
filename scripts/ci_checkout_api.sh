#!/bin/bash
# This script only runs on circleci, just before the e2e tests
# first version cfr. https://discuss.circleci.com/t/add-ability-to-cache-apt-get-programs/598/6

if [[ ! -z "${CIRCLE_BRANCH}" ]]; then
  CI_BRANCH="${CIRCLE_BRANCH}"
fi

if [[ ! -z "${GITHUB_REF}" ]]; then
  CI_BRANCH="${GITHUB_REF##*/}"
fi

CI_BRANCH=${CI_BRANCH:=master}



API_TARBALL_URL="https://codeload.github.com/opencollective/opencollective-api/tar.gz/"
echo "> Check ${API_TARBALL_URL}${CI_BRANCH}"
if curl -s --head --request GET "${API_TARBALL_URL}${CI_BRANCH}" | grep "200" > /dev/null
then
  BRANCH=$CI_BRANCH;
else
  BRANCH="master";
fi

# If we already have an archive of the branch locally (in ~/cache)
# Then we check to see if the size matches the online version
# If they do, we proceed to start the api server
# Otherwise we remove the local cache and install latest version of the branch

TARBALL_SIZE=$(curl -s --head --request GET "${API_TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")

if [ ! $TARBALL_SIZE ]; then
  # First request doesn't always provide the content length for some reason (it's probably added by their caching layer)
  TARBALL_SIZE=$(curl -s --head --request GET "${API_TARBALL_URL}${BRANCH}" | grep "Content-Length" | sed -E "s/.*: *([0-9]+).*/\1/")
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
  mkdir -p $API_FOLDER
  rm -rf $API_FOLDER
  mv "opencollective-api-${BRANCH//\//-}" $API_FOLDER
fi
