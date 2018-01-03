#!/bin/bash
# This script only runs on circleci, just before the e2e tests
# first version cfr. https://discuss.circleci.com/t/add-ability-to-cache-apt-get-programs/598/6


if [ "$NODE_ENV" = "circleci" ]; then
  echo "Installing Google Chrome for E2E tests";
else
  exit;
fi

# Install Google Chrome
mkdir ~/cache
cd ~/cache

if [ ! -e "google-chrome-stable_current_amd64.deb" ]; then
  wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
fi;

sudo dpkg -i ./google-chrome*.deb
sudo apt-get install -f

sudo apt-get install GraphicsMagick

API_TARBALL_URL="https://codeload.github.com/opencollective/opencollective-api/tar.gz/";
if curl -s --head  --request GET "${API_TARBALL_URL}${CIRCLE_BRANCH}" | grep "200" > /dev/null
then
  BRANCH=$CIRCLE_BRANCH;
else
  BRANCH="master";
fi

if [ ! -e "${BRANCH}.tgz" ];
then
  echo "> Downloading tarball ${API_TARBALL_URL}${BRANCH}"
  curl  "${API_TARBALL_URL}${BRANCH}" -o "${BRANCH}.tgz"
  echo "> Extracting ${BRANCH}.tgz"
  tar -xzf "${BRANCH}.tgz"
  sleep 2
  cd "opencollective-api-${BRANCH}"
  echo "> Running npm install for api"
  npm install
  cd ..
fi

cd "opencollective-api-${BRANCH}"
echo "> Restoring opencollective_dvl database for e2e testing";
./scripts/db_restore.sh -d opencollective_dvl -f test/dbdumps/opencollective_dvl.pgsql

echo "✓ API is setup";