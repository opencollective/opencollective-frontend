#!/bin/bash

if [ "$NODE_ENV" = "circleci" ]; then
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
fi


# Set `$CYPRESS_RECORD` to `true` in ENV to activate records
if [ "$CYPRESS_RECORD" = "true" ]; then
  CYPRESS_RECORD="--record"
else
  CYPRESS_RECORD="--record false"
fi

# Set `$CYPRESS_VIDEO` to `false` in ENV to de-activate videos recording.
# See https://docs.cypress.io/guides/references/configuration.html#Videos

# Wait for a service to be up
function wait_for_service() {
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

echo ""
wait_for_service MAILDEV 127.0.0.1 1080
echo ""
wait_for_service API 127.0.0.1 3000
echo ""
wait_for_service Frontend 127.0.0.1 3060

echo ""
echo "> Running cypress tests"
npx cypress run ${CYPRESS_RECORD}
RETURN_CODE=$?
if [ $RETURN_CODE -ne 0 ]; then
  echo "Error with cypress e2e tests, exiting"
  exit 1;
fi
echo ""

if [ "$NODE_ENV" = "circleci" ]; then
  echo "Killing all node processes"
  kill $MAILDEV_PID;
  kill $API_PID;
  kill $FRONTEND_PID;
  echo "Exiting with code $RETURN_CODE"
  exit $RETURN_CODE
fi
