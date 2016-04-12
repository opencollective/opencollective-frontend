#!/usr/bin/env bash

main() {
  # exit script if any error occurs
  set -e

  # cleanup upon exit or termination
  trap "finish 2" INT
  trap "finish 15" TERM
  trap 'finish $?' EXIT

  # check script parameters
  for STEP in $@; do
    parseStep
  done

  # set variables
  LOCAL_DIR=$PWD
  LOCAL_NAME=$(basename ${LOCAL_DIR})
  [ -f "${LOCAL_DIR}/.env" ] && source ${LOCAL_DIR}/.env

  for STEP in $@; do
    if [ ${STEP} != "cleanup" ]; then
      # parse script parameters
      parseStep
      # set repository location
      setRepoDir
      if [ "$PHASE" = "install" ]; then
        install
      elif [ "$PHASE" = "run" ]; then
        setArtifactsDir
        [ "$REPO_NAME" = "api" ] && setPgDatabase
        run
      elif [ "$PHASE" = "testE2E" ]; then
        testE2E
      fi
    fi
  done
}

cleanup() {
  #pkill -f node selenium chromedriver Chrome
  pkill node || true
}

finish() {
  # can't rely on $? because of the sleep command running in parallel with spawned jobs
  EXIT_CODE=$1
  if [ ${EXIT_CODE} -ne 0 ]; then
    trap '' EXIT TERM
    cleanup
  fi
  echo "Finished with exit code $EXIT_CODE."
  exit ${EXIT_CODE}
}

parseStep() {
  if [ "${STEP}" = "cleanup" ]; then
    cleanup
  else
    REPO_NAME=$(echo ${STEP} | sed 's/:.*//')
    PHASE=$(echo ${STEP} | sed 's/.*://')
    if ( [ "$REPO_NAME" != "api" ] && [ "$REPO_NAME" != "website" ] && [ "$REPO_NAME" != "app" ] ) ||
       ( [ "$PHASE" != "install" ] && [ "$PHASE" != "run" ] && [ "$PHASE" != "testE2E" ] ) ||
       ( [ "$REPO_NAME" = "api" ] && [ "$PHASE" = "testE2E" ] ); then

      echo "Unrecognized step $STEP"
      usage 1;
    fi
  fi
}

usage() {
  CMD=test_e2e.sh
  echo " "
  echo "Usage: $CMD [<repo>:<phase> <repo>:<phase> ... <repo>:<phase>] [cleanup]"
  echo " "
  echo "  <repo>:  api, website or app"
  echo "  <phase>: install, run or testE2E. testE2E not applicable to api."
  echo " "
  echo "E.g : $CMD website:install"
  echo "      $CMD website:run"
  echo " "
  echo "      $CMD cleanup"
  echo " "
  exit $1;
}

setRepoDir() {
  if [ ${REPO_NAME} = ${LOCAL_NAME} ]; then
    REPO_DIR=${LOCAL_DIR}
  else
    if [ "$NODE_ENV" = "development" ]; then
      REPO_DIR_VAR_NAME=$(echo ${REPO_NAME} | awk '{print toupper($0)}')_DIR
      if [ ! -d "${!REPO_DIR_VAR_NAME}" ]; then
        echo "$REPO_DIR_VAR_NAME not configured in .env"
        exit 1
      fi
      REPO_DIR=${!REPO_DIR_VAR_NAME}
    else
      REPO_DIR="$HOME/$REPO_NAME"
    fi
  fi
}

setArtifactsDir() {
  if [ "$NODE_ENV" = "development" ]; then
    ARTIFACTS_DIR="${LOCAL_DIR}/test/e2e/output"
  else
    ARTIFACTS_DIR="${CIRCLE_ARTIFACTS}/e2e"
  fi
  mkdir -p ${ARTIFACTS_DIR}
  echo "Artifacts directory set to $ARTIFACTS_DIR"
}

setPgDatabase() {
  if [ "$NODE_ENV" = "development" ]; then
    # don't override developer's database
    echo "setting PG_DATABASE=opencollective_e2e"
    export PG_DATABASE=opencollective_e2e
  fi
}

install() {
  if [ -d ${REPO_DIR} ]; then
    echo "$REPO_NAME already checked out to $REPO_DIR"
  else
    echo "Checking out $REPO_NAME into $REPO_DIR"
    # use Github SVN export to avoid fetching git history, faster
    REPO_SVN=https://github.com/OpenCollective/${REPO_NAME}/trunk
    svn export ${REPO_SVN} ${REPO_DIR}
  fi
  cd ${REPO_DIR}
  echo "Performing NPM install"
  START=$(date +%s)
  npm install
  END=$(date +%s)
  echo "Executed NPM install in $(($END - $START)) seconds"
  linkRepoNmToCache
}

linkRepoNmToCache() {
  REPO_NM="${REPO_DIR}/node_modules/"
  CACHE_DIR="${HOME}/cache/"
  [ -d ${CACHE_DIR} ] || mkdir ${CACHE_DIR}
  REPO_NM_CACHE="${CACHE_DIR}/${REPO_NAME}_node_modules"
  echo "Linking ${REPO_NM_CACHE} -> ${REPO_NM}"
  ln -s ${REPO_NM} ${REPO_NM_CACHE}
}

runProcess() {
  NAME=$1
  cd $2
  COMMAND=$3
  LOG_FILE="$ARTIFACTS_DIR/$NAME.log"
  PARENT=$$
  # in case spawned process exits unexpectedly, kill parent process and its sub-processes (via the trap)
  sh -c "$COMMAND | tee $LOG_FILE 2>&1;
         kill $PARENT 2>/dev/null" &
  echo "Started $NAME with PID $! and saved output to $LOG_FILE"
  # Wait for startup. Break down sleep into pieces to allow prospective kill signals to get trapped.
  if [ "$NODE_ENV" = "development" ]; then
    DELAY=5
  else
    DELAY=40
  fi
  for i in $(seq ${DELAY}); do sleep 1; done
  echo "Waited for $NAME startup during $DELAY seconds"
}

run() {
  if [ ! -d ${REPO_DIR} ]; then
    echo "${REPO_NAME} not installed in ${REPO_DIR}, exiting."
    exit 1;
  else
    runProcess ${REPO_NAME} ${REPO_DIR} 'npm start'
  fi
}

testE2E() {
  echo "Starting ${REPO_NAME} E2E tests"
  cd ${REPO_DIR}
  npm run nightwatch
  echo "Finished ${REPO_NAME} E2E tests"
}

main $@