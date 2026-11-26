#!/bin/bash

# Specs migrate to Playwright shard by shard (docs/e2e.md). A shard whose specs are all gone stays a required
# check until a maintainer retires it, so it passes, saying so, instead of failing on "no spec files".
if [ -n "$CYPRESS_TEST_FILES" ]; then
  shopt -s extglob nullglob
  # Cypress reads `0*.(js|ts)` as a glob group; bash's extglob spells it `0*.@(js|ts)`.
  SHARD_GLOB="${CYPRESS_TEST_FILES//\(/@(}"
  SHARD_SPECS=(test/cypress/integration/$SHARD_GLOB)
  shopt -u extglob nullglob
  if [ ${#SHARD_SPECS[@]} -eq 0 ]; then
    echo "> No Cypress spec matches '${CYPRESS_TEST_FILES}': every spec of this shard moved to Playwright. Nothing to run."
    exit 0
  fi
  echo "> Cypress specs in this shard: ${SHARD_SPECS[*]}"
fi

echo "> Setting locale to en_US"
export LANGUAGE=en-US
export LANG=en-US
export LC_ALL=en-US

echo "> Starting stripe webhook listener"
export STRIPE_WEBHOOK_SIGNING_SECRET=$(stripe --api-key $STRIPE_WEBHOOK_KEY listen --forward-connect-to localhost:3060/webhooks/stripe --print-secret)
stripe --api-key $STRIPE_WEBHOOK_KEY listen --forward-connect-to localhost:3060/webhooks/stripe >/dev/null &
STRIPE_WEBHOOK_PID=$!

echo "> Starting api server"
if [ -z "$API_FOLDER" ]; then
  cd ~/api
else
  cd $API_FOLDER
fi
# The Cypress helpers create their test users through the real sign-up (`/users/signup` + OTP),
# which the API limits to 5 per IP per 15 minutes: a run creates many more.
PG_DATABASE=opencollective_dvl MAILPIT_CLIENT=true DISABLE_RATE_LIMITING=1 npm run start:e2e:server &
API_PID=$!
echo "> Starting mailpit server"
npm run mailpit &
MAILPIT_PID=$!
cd -

echo "> Starting frontend server"
if [ -z "$FRONTEND_FOLDER" ]; then
  cd ~/frontend
else
  cd $FRONTEND_FOLDER
fi
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON server/index.ts &
FRONTEND_PID=$!
cd -

echo "> Starting images server"
if [ -z "$IMAGES_FOLDER" ]; then
  cd ~/images
else
  cd $IMAGES_FOLDER
fi
npm start &
IMAGES_PID=$!
cd -

echo "> Starting PDF server"
if [ -z "$PDF_FOLDER" ]; then
  cd ~/pdf
else
  cd $PDF_FOLDER
fi
PORT=3002 API_URL=http://localhost:3060 npm start &
PDF_PID=$!
cd -

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
  local start_time=$(date +%s)
  local timeout=300  # 5 minutes in seconds
  while true; do
    nc -z "$2" "$3"
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "> Application $1 is up!"
      break
    fi
    local current_time=$(date +%s)
    local elapsed_time=$((current_time - start_time))
    if [ $elapsed_time -ge $timeout ]; then
      echo "> Timeout waiting for $1 after 5 minutes"
      exit 1
    fi
    sleep 1
  done
}

echo ""
wait_for_service MAILDEV 127.0.0.1 1080
echo ""
wait_for_service API 127.0.0.1 3060
echo ""
wait_for_service Frontend 127.0.0.1 3000
echo ""
wait_for_service IMAGES 127.0.0.1 3001
echo ""
wait_for_service PDF 127.0.0.1 3002

echo ""
echo "> Running cypress tests"

npm run cypress:run -- ${CYPRESS_RECORD} --browser chromium --env OC_ENV=$OC_ENV --spec "test/cypress/integration/${CYPRESS_TEST_FILES}"

RETURN_CODE=$?
if [ $RETURN_CODE -ne 0 ]; then
  echo "Error with cypress e2e tests, exiting"
  exit 1
fi
echo ""

echo "Killing all node processes"
kill $MAILPIT_PID
kill $STRIPE_WEBHOOK_PID
kill $API_PID
kill $FRONTEND_PID
kill $IMAGES_PID
kill $PDF_PID
echo "Exiting with code $RETURN_CODE"
exit $RETURN_CODE
