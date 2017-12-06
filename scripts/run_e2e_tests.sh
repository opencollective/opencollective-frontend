#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Starting frontend server"
  npm start &
  echo "Waiting 10s"
  sleep 10
fi
echo "Starting e2e jest tests"
jest test/e2e/* -w 1