#!/bin/bash

cleanup() {
  for pid in "${MAILPIT_PID:-}" "${STRIPE_WEBHOOK_PID:-}" "${API_PID:-}" "${FRONTEND_PID:-}" "${IMAGES_PID:-}" "${PDF_PID:-}"; do
    if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "> Setting locale to en_US"
export LANGUAGE=en-US
export LANG=en-US
export LC_ALL=en-US

echo "> Starting stripe webhook listener"
STRIPE_WEBHOOK_SIGNING_SECRET=$(stripe --api-key "$STRIPE_WEBHOOK_KEY" listen --forward-connect-to localhost:3060/webhooks/stripe --print-secret) || exit 1
export STRIPE_WEBHOOK_SIGNING_SECRET
stripe --api-key "$STRIPE_WEBHOOK_KEY" listen --forward-connect-to localhost:3060/webhooks/stripe >/dev/null &
STRIPE_WEBHOOK_PID=$!

echo "> Starting api server"
if [ -z "$API_FOLDER" ]; then
  cd ~/api || exit 1
else
  cd "$API_FOLDER" || exit 1
fi
PG_DATABASE=opencollective_dvl MAILPIT_CLIENT=true ./node_modules/.bin/turbo run start:e2e:server --single-package --root-turbo-json=turbo.standalone.json &
API_PID=$!
echo "> Starting mailpit server"
npm run mailpit &
MAILPIT_PID=$!
cd - || exit 1

echo "> Starting frontend server"
if [ -z "$FRONTEND_FOLDER" ]; then
  cd ~/frontend || exit 1
else
  cd "$FRONTEND_FOLDER" || exit 1
fi
./node_modules/.bin/turbo run start:e2e --single-package --root-turbo-json=turbo.standalone.json &
FRONTEND_PID=$!
cd - || exit 1

echo "> Starting images server"
if [ -z "$IMAGES_FOLDER" ]; then
  cd ~/images || exit 1
else
  cd "$IMAGES_FOLDER" || exit 1
fi
./node_modules/.bin/turbo run start:built --single-package --root-turbo-json=turbo.standalone.json &
IMAGES_PID=$!
cd - || exit 1

echo "> Starting PDF server"
if [ -z "$PDF_FOLDER" ]; then
  cd ~/pdf || exit 1
else
  cd "$PDF_FOLDER" || exit 1
fi
PORT=3002 API_URL=http://localhost:3060 ./node_modules/.bin/turbo run start:built --single-package --root-turbo-json=turbo.standalone.json &
PDF_PID=$!

cd - || exit 1

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
  local start_time
  start_time=$(date +%s)
  local timeout=300  # 5 minutes in seconds
  while true; do
    nc -z "$2" "$3"
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "> Application $1 is up!"
      break
    fi
    local current_time
    current_time=$(date +%s)
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

npm run turbo -- run cypress:run -- ${CYPRESS_RECORD} --browser chromium --env "OC_ENV=$OC_ENV" --spec "test/cypress/integration/${CYPRESS_TEST_FILES}"

RETURN_CODE=$?
if [ $RETURN_CODE -ne 0 ]; then
  echo "Error with cypress e2e tests, exiting"
  exit 1
fi
echo ""

echo "Exiting with code $RETURN_CODE"
exit "$RETURN_CODE"
