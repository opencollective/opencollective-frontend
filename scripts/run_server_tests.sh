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
fi

echo ""
echo "> Starting server jest tests"
jest test/server/*
RETURN_CODE=$?
if [ $RETURN_CODE -ne 0 ]; then
  echo "Error with jest tests, exiting"
  exit 1;
fi

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Killing all node processes"
  kill $API_PID;
  kill $FRONTEND_PID;
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
fi
