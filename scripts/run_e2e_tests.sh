#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo "> Starting api server"
  cd ~/cache/opencollective-api-*
  PG_DATABASE=opencollective_dvl npm start &
  cd -
  echo "> Starting frontend server"
  npm start &
  echo "> Running cypress tests"
  cypress run --record
else
  echo "> Running cypress tests"
  cypress run --record
fi
echo "Starting e2e jest tests"
jest test/e2e/* -w 1
