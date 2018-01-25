#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo "> Starting api server"
  cd ~/cache/opencollective-api
  PG_DATABASE=opencollective_dvl npm start &
  API_PID=$!
  cd -
  echo "> Starting frontend server"
  npm start &
  FRONTEND_PID=$!
fi
echo ""
echo "> Starting server jest tests"
jest test/server/*
echo ""
echo "> Running cypress tests"
cypress run --record
if [ $? -ne 0 ]; then
  echo "Error with cypress e2e tests, exiting"
  exit 1;
fi
echo ""
echo "> Starting e2e jest tests"
jest test/e2e/* -w 1
RETURN_CODE=$?

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Killing all node processes"
  kill $API_PID;
  kill $FRONTEND_PID;
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
fi