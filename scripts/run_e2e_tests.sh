#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo "> Starting api server"
  cd ~/api
  PG_DATABASE=opencollective_dvl npm start &
  API_PID=$!
  cd -
  echo "> Starting frontend server"
  if [ -d "/home/circleci/frontend" ]; then
    cd ~/frontend
    npm start &
    FRONTEND_PID=$!
    cd -
  else
    npm start &
    FRONTEND_PID=$!
  fi
  # Record video and upload them if test fail on CI
  CYPRESS_CONFIG="video=true,videoUploadOnPasses=true"
  CYPRESS_RECORD="--record"
else
  # Never record video in dev
  CYPRESS_CONFIG="video=false"
  CYPRESS_RECORD=""
fi

echo ""
echo "> Running cypress tests"
npx cypress run ${CYPRESS_RECORD} --config ${CYPRESS_CONFIG}
RETURN_CODE=$?
if [ $RETURN_CODE -ne 0 ]; then
  echo "Error with cypress e2e tests, exiting"
  exit 1;
fi
echo ""

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Killing all node processes"
  kill $API_PID;
  kill $FRONTEND_PID;
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
fi
