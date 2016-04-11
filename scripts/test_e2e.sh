#!/usr/bin/env bash

# exit script if any error occurs
set -e

usage() {
  echo "Usage: $0 <repo> [<phase>]"
  echo " "
  echo "  <repo>:  api, website or app"
  echo "  <phase>: install or run. Executes both if none specified."
  echo " "
  echo "E.g : $0 website install"
  echo "      $0 website run"
  echo " "
  echo " -or- $0 website"
  echo " "
  exit $1;
}

# Parsing script parameters
API_DIR=$PWD
CLIENT=$1
if [ "$CLIENT" != "website" ] && [ "$CLIENT" != "app" ]; then
  usage 1;
fi
PHASES=$2
if [ "$PHASES" != "" ]; then
  if [ "$PHASES" != "install" ] && [ "$PHASES" != "run" ]; then
    usage 1;
  fi
else
  PHASES="install run"
fi

setClientDir() {
  DIR_VAR_NAME=$(echo ${CLIENT} | awk '{print toupper($0)}')_DIR
  if [ -f ".env" ] && [ -d "${!DIR_VAR_NAME}" ]; then
    echo ${!DIR_VAR_NAME}
  else
    echo "$API_DIR/$CLIENT-checkout"
  fi
}

# setting variables
[ -f "${API_DIR}/.env" ] && source ${API_DIR}/.env
CLIENT_DIR=$(setClientDir)

if [ "$NODE_ENV" = "development" ]; then
  ARTIFACTS_DIR="${API_DIR}/test/e2e/output"
  # don't override developer's database
  echo "setting PG_DATABASE=opencollective_e2e"
  export PG_DATABASE=opencollective_e2e
else
  ARTIFACTS_DIR="${CIRCLE_ARTIFACTS}/e2e"
fi
mkdir -p ${ARTIFACTS_DIR}

finish() {
  EXIT_CODE=$?
  if [ ! ${EXIT_CODE} ]; then
    trap '' ERR
    #pkill -f node selenium chromedriver Chrome
    # for some reason the node processes spawned by npm aren't killed upon exit, but others seem to be
    pkill -f node
  fi
  echo "Finished $0 $CLIENT $PHASE with exit code ${EXIT_CODE}."
  exit ${EXIT_CODE}
}

# cleanup upon exit
trap finish EXIT TERM

installClient() {
  if [ -d ${CLIENT_DIR} ]; then
    echo "$CLIENT already checked out to $CLIENT_DIR"
  else
    echo "Checking out $CLIENT into ${CLIENT_DIR}"
    # use Github SVN export to avoid fetching git history, faster
    REMOTE_SVN=https://github.com/OpenCollective/${CLIENT}/trunk
    svn export $REMOTE_SVN ${CLIENT_DIR}
  fi
  cd ${CLIENT_DIR}
  echo "Performing NPM install"
  START=$(date +%s)
  npm install
  END=$(date +%s)
  echo "Finished executing NPM install in $(($END - $START)) seconds"
}

linkClientNmToCache() {
  CLIENT_NM="${CLIENT_DIR}/node_modules/"
  CLIENT_NM_CACHE="${HOME}/cache/${CLIENT}_node_modules"
  echo "Linking ${CLIENT_NM_CACHE} -> ${CLIENT_NM}"
  ln -s ${CLIENT_NM_CACHE} ${CLIENT_NM}
}

runProcess() {
  NAME=$1
  cd $2
  COMMAND=$3
  LOG_FILE="$ARTIFACTS_DIR/$NAME.log"
  PARENT=$$
  echo "Starting $NAME and saving output to $LOG_FILE"
  # in case spawned process exits unexpectedly, kill parent process and its sub-processes (via the trap)
  sh -c "$COMMAND | tee $LOG_FILE 2>&1;
         kill $PARENT 2>/dev/null" &
  sleep 20
}

runApi() {
  runProcess api ${API_DIR} 'npm start'
}

runClient() {
  if [ ! -d ${CLIENT_DIR} ]; then
    echo "${CLIENT} not installed in ${CLIENT_DIR}, exiting."
    exit 1;
  else
    runProcess ${CLIENT} ${CLIENT_DIR} 'npm start'
  fi
}

testE2E() {
  echo "Starting ${CLIENT} E2E tests"
  cd ${CLIENT_DIR}
  npm run nightwatch
  echo "Finished ${CLIENT} E2E tests"
}

for PHASE in ${PHASES}; do
  if [ "$PHASE" = "install" ]; then
    installClient;
    linkClientNmToCache;
  elif [ "$PHASE" = "run" ]; then
    runApi;
    runClient;
    testE2E;
  fi
done