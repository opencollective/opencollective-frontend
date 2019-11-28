#!/bin/bash

# Starts maildev, api and frontend servers.
function start_app {
  cd ~/api

  echo "> Starting maildev server"
  npx maildev &
  MAILDEV_PID=$!

  echo "> Starting api server"
  PG_DATABASE=opencollective_dvl MAILDEV_CLIENT=true npm start &
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
}

# Stops maildev, api and frontend servers.
function stop_app {
  echo "Killing all node processes"
  kill $MAILDEV_PID;
  kill $API_PID;
  kill $FRONTEND_PID;
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
}

# Wait for a service to be up
function wait_for_service {
  echo "> Waiting for $1 to be ready... "
  while true; do
    nc -z "$2" "$3"
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "> Application $1 is up!"
      break
    fi
    sleep 1
  done
}

function wait_for_app_services {
  echo ""
  wait_for_service MAILDEV 127.0.0.1 1080
  echo ""
  wait_for_service API 127.0.0.1 3000
  echo ""
  wait_for_service Frontend 127.0.0.1 3060
}
