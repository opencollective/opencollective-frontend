#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo "> Starting api server"
  cd ~/cache/opencollective-api
  PG_DATABASE=opencollective_dvl npm start &
  cd -
  echo "> Starting frontend server"
  npm start &
fi
echo ""
echo "> Starting server jest tests"
jest test/server/*
echo ""
echo "> Running cypress tests"
cypress run --record
echo ""
echo "> Starting e2e jest tests"
RETURN_CODE=jest test/e2e/* -w 1

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Killing all node processes"
  killall node
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
fi