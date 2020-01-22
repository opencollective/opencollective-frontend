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

ARCHIVE="${BRANCH//\//-}.tgz"
TIMESTAMP="$(date +%s)"

echo "> Downloading tarball ${TARBALL_URL}${BRANCH}?nocache=${TIMESTAMP}"
curl "${TARBALL_URL}${BRANCH}?nocache=${TIMESTAMP}" -o $ARCHIVE
echo "> Extracting $ARCHIVE"
tar -xzf $ARCHIVE
mkdir -p $FRONTEND_FOLDER
rm -rf $FRONTEND_FOLDER
mv "opencollective-frontend-${BRANCH//\//-}" $FRONTEND_FOLDER
mv $ARCHIVE $FRONTEND_FOLDER/archive.tar.gz
