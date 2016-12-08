#!/usr/bin/env bash

main() {
  # exit script if any error occurs
  set -e

  # cleanup upon interruption, termination or exit
  trap 'echo "Received INT signal"; finish 2' INT
  trap 'echo "Received TERM signal"; finish 15' TERM
  trap 'EXIT_CODE=$?; echo "Received EXIT signal"; finish ${EXIT_CODE}' EXIT

  scanFileParameter $@
  parseSteps
  setCommonEnvironment
  cleanup

  for STEP in ${STEPS}; do
    echo "Running step $STEP"
    parseStep
    setRepoDir

    if [ "$REPO_NAME" = "opencollective-api" ]; then
      setPgDatabase
    fi

    if [ "$PHASE" = "install" ]; then
      install
    elif [ "$PHASE" = "run" ]; then
      run
    elif [ "$PHASE" = "testE2E" ]; then
      testE2E
    fi
  done
}

cleanup() {
  echo "Cleaning up node processes"
  #pkill -f node selenium chromedriver Chrome
  pkill node || true
}

finish() {
  # can't rely on $? because of the sleep command running in parallel with spawned jobs
  EXIT_CODE=$1
  trap '' INT TERM EXIT
  if [ "$NODE_ENV" = "development" ]; then
    cleanup
  fi
  echo "Finished with exit code $EXIT_CODE."
  exit ${EXIT_CODE}
}

get_abs_filename() {
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

scanFileParameter() {
  if [ $# -eq 0 ]; then
    usage
  fi
  for PARAM in $@; do
    if [[ "$PARAM" =~ e2e\/.*\.js$ ]]; then
      setTestFile ${PARAM}
    else
      PARAMS="$PARAMS $PARAM"
    fi
  done
}

setTestFile() {
  ABS_FILE=$(get_abs_filename $1)
  if [[ "$ABS_FILE" =~ website\/ ]]; then
    WEBSITE_TEST_FILE=$1
    echo "Setting website E2E test file to $WEBSITE_TEST_FILE"
  elif [[ "$ABS_FILE" =~ app\/ ]]; then
    APP_TEST_FILE=$1
    echo "Setting app E2E test file to $APP_TEST_FILE"
  else
    echo "Provided file is neither for website nor for app"
    usage 1;
  fi
}

parseSteps() {
  for STEP in ${PARAMS}; do
    parseStep
    if ( [ "$REPO_NAME" = "opencollective-website" ] && [ ! -z "$APP_TEST_FILE" ] ) ||
       ( [ "$REPO_NAME" = "opencollective-app" ] && [ ! -z "$WEBSITE_TEST_FILE" ] ); then
      echo "Skipping $STEP"
      continue
    fi
    STEPS="$STEPS $STEP"
  done
}

parseStep() {
  REPO_NAME=opencollective-$(echo ${STEP} | sed 's/:.*//')
  PHASE=$(echo ${STEP} | sed 's/.*://')
  if ( [ "$REPO_NAME" != "opencollective-api" ] && [ "$REPO_NAME" != "opencollective-website" ] && [ "$REPO_NAME" != "opencollective-app" ] ) ||
     ( [ "$PHASE" != "install" ] && [ "$PHASE" != "run" ] && [ "$PHASE" != "testE2E" ] ) ||
     ( [ "$REPO_NAME" = "opencollective-api" ] && [ "$PHASE" = "testE2E" ] ); then    echo "Unrecognized step $STEP"
    usage 1;
  fi
}

setOutputDir() {
  OUTPUT_DIR=$(bash scripts/test_output_dir.sh e2e)
  echo "Output directory set to $OUTPUT_DIR"
}

setCommonEnvironment() {
  LOCAL_DIR=$PWD
  LOCAL_NAME=$(basename ${LOCAL_DIR})
  if [ -f "${LOCAL_DIR}/.env" ]; then
    source ${LOCAL_DIR}/.env
  fi
  if [ -z "${NODE_ENV}" ]; then
    NODE_ENV=development
  fi
  setOutputDir
}

usage() {
  CMD=test_e2e.sh
  echo " "
  echo "Usage: $CMD <repo>:<phase> [<repo>:<phase> ... <repo>:<phase>] [path/to/e2e/test.js]"
  echo " "
  echo "  <repo>:  api, website or app"
  echo "  <phase>: install, run or testE2E. testE2E not applicable to api."
  echo " "
  echo "E.g : Install website and app:"
  echo "      $CMD website:install app:install"
  echo " "
  echo "      Run all website tests (api and website already installed):"
  echo "      $CMD api:run website:run website:testE2E"
  echo " "
  echo "      Run all website and app tests:"
  echo "      $CMD api:run website:run website:testE2E app:run app:testE2E"
  echo " "
  echo "      Run single website test file:"
  echo "      $CMD api:run website:run website:testE2E ../website/test/e2e/expenses_page.js"
  echo " "
  exit $1;
}

setRepoDir() {
  if [ ${REPO_NAME} = ${LOCAL_NAME} ]; then
    REPO_DIR=${LOCAL_DIR}
  else
    if [ "$NODE_ENV" = "development" ]; then
      REPO_DIR_VAR_NAME=$(echo ${REPO_NAME} | sed 's/opencollective-//' | awk '{print toupper($0)}')_DIR
      if [ ! -d "${!REPO_DIR_VAR_NAME}" ]; then
        echo "$REPO_DIR_VAR_NAME not configured in .env"
        exit 1
      fi
      REPO_DIR=${!REPO_DIR_VAR_NAME}
    else
      mkdir -p "$HOME/cache"
      REPO_DIR="$HOME/cache/$REPO_NAME"
    fi
  fi
}

install() {
  if [ -d ${REPO_DIR} ]; then
    echo "$REPO_NAME already checked out to $REPO_DIR"
  else
    echo "Checking out $REPO_NAME into $REPO_DIR"
    # use Github SVN export to avoid fetching git history, faster
    TARBALL=https://codeload.github.com/OpenCollective/${REPO_NAME}/tar.gz/master
    curl -o archive.tgz $TARBALL
    tar -xzf archive.tgz
    mv ${REPO_NAME}-master ${REPO_DIR}
    cd ${REPO_DIR}
    echo "Performing NPM install"
    npm install
  fi
}

setPgDatabase() {
  if [ "$NODE_ENV" = "development" ]; then
    # don't screw up developer's opencollective_localhost
    echo "setting PG_DATABASE=opencollective_test"
    export PG_DATABASE=opencollective_test
  fi
}

runProcess() {
  cd ${REPO_DIR}
  LOG_FILE="$OUTPUT_DIR/$REPO_NAME.log"
  PARENT=$$
  # in case spawned process exits unexpectedly, kill parent process and its sub-processes (via the trap)
  sh -c "npm start > $LOG_FILE;
         kill $PARENT 2>/dev/null" &
  echo "Started $REPO_NAME with PID $! and saving output to $LOG_FILE"
  # TODO should somehow detect when process is ready instead of fragile hard-coded delay
  if [ "$NODE_ENV" = "development" ]; then
    DELAY=5
  else
    DELAY=20
  fi
  echo "Waiting for $REPO_NAME startup during $DELAY seconds"
  # Wait for startup. Break down sleep into pieces to allow prospective kill signals to get trapped.
  for i in $(seq ${DELAY}); do sleep 1; done
  echo "Waited for $REPO_NAME startup during $DELAY seconds"
}

run() {
  if [ ! -d ${REPO_DIR} ]; then
    echo "${REPO_NAME} not installed in ${REPO_DIR}, exiting."
    exit 1;
  else
    runProcess
  fi
}

testE2E() {
  cd ${REPO_DIR}
  if [ "$REPO_NAME" = "opencollective-website" ] && [ ! -z "$WEBSITE_TEST_FILE" ]; then
    echo "Starting ${REPO_NAME} E2E with test file $WEBSITE_TEST_FILE"
    npm run nightwatch -- --test ${WEBSITE_TEST_FILE}
  elif [ "$REPO_NAME" = "opencollective-app" ] && [ ! -z "$APP_TEST_FILE" ]; then
    echo "Starting ${REPO_NAME} E2E with test file $APP_TEST_FILE"
    npm run nightwatch -- --test ${APP_TEST_FILE}
  else
    echo "Starting ${REPO_NAME} E2E tests"
    npm run nightwatch
  fi
  echo "Finished ${REPO_NAME} E2E tests"
}

main $@
