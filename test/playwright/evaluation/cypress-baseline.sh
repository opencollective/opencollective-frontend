#!/usr/bin/env bash
# Benchmark scaffolding: the Cypress side of a pilot benchmark pair.
#
# Mirrors the required CI shards (scripts/setup_db.sh, then
# scripts/run_e2e_tests.sh) for the two original pilot files, with these
# differences, all to match the Playwright side of the pair:
#   - the database is restored with the runner's pg_restore (as the Playwright
#     launcher does) instead of the postgres Docker image;
#   - Mailpit is the job's service container, not `npm run mailpit`;
#   - no Stripe webhook listener: neither pilot file uses Stripe;
#   - Chromium is the browser binary passed as $3 (the Playwright one);
#   - with PROCESSES=2 the two files run as two concurrent `cypress run`
#     processes against the one stack (the finest parallelism Cypress offers
#     on one machine without Cypress Cloud).
#
# Usage: cypress-baseline.sh PROCESSES OUT_DIR BROWSER
# Prints launcher-style phase markers read by `cli.ts collect-run`.

set -uo pipefail

PROCESSES="$1"
OUT="$2"
BROWSER="$3"
FRONTEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SPECS=(test/cypress/integration/27-expenses.test.ts test/cypress/integration/41-vendor-visibility.test.ts)
PGIDS=()

stop_services() {
  for pgid in "${PGIDS[@]}"; do
    kill -TERM -- "-$pgid" 2>/dev/null || true
  done
  sleep 2
  for pgid in "${PGIDS[@]}"; do
    kill -KILL -- "-$pgid" 2>/dev/null || true
  done
}
trap stop_services EXIT

start() {
  local name="$1"
  shift
  setsid bash -c "$*" >"$OUT/cypress-$name.log" 2>&1 &
  PGIDS+=($!)
}

wait_for_port() {
  local name="$1" port="$2" start
  start=$(date +%s)
  echo "> Waiting for $name (port $port)"
  until nc -z 127.0.0.1 "$port"; do
    if (($(date +%s) - start >= 300)); then
      echo "> $name did not open port $port within 300s"
      return 1
    fi
    sleep 1
  done
}

echo "> Restoring disposable database (opencollective_dvl) from API dump"
(cd "$API_FOLDER" && npm run db:restore && npm run db:migrate) >"$OUT/cypress-db-restore.log" 2>&1 || {
  echo "> Database restore failed"
  exit 3
}

export LANGUAGE=en-US LANG=en-US LC_ALL=en-US
echo "> Starting API, frontend, images and PDF"
start api "cd '$API_FOLDER' && PG_DATABASE=opencollective_dvl MAILPIT_CLIENT=true npm run start:e2e:server"
start frontend "cd '$FRONTEND' && node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON server/index.ts"
start images "cd '$IMAGES_FOLDER' && npm start"
start pdf "cd '$PDF_FOLDER' && PORT=3002 API_URL=http://localhost:3060 npm start"
for service in "API 3060" "Frontend 3000" "Images 3001" "PDF 3002"; do
  # shellcheck disable=SC2086
  wait_for_port $service || exit 3
done

echo "> Running Cypress: ${SPECS[*]} (processes=$PROCESSES)"
cd "$FRONTEND"
if [[ "$PROCESSES" == 1 ]]; then
  node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON test/playwright/evaluation/run-cypress.ts \
    --spec "$(IFS=,; echo "${SPECS[*]}")" --browser "$BROWSER" --out "$OUT/cypress-results.json"
  status=$?
else
  pids=()
  for index in "${!SPECS[@]}"; do
    xvfb-run -a node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON test/playwright/evaluation/run-cypress.ts \
      --spec "${SPECS[$index]}" --browser "$BROWSER" --out "$OUT/cypress-results-$index.json" \
      >"$OUT/cypress-process-$index.log" 2>&1 &
    pids+=($!)
  done
  status=0
  for pid in "${pids[@]}"; do
    wait "$pid" || status=$?
  done
  cat "$OUT"/cypress-process-*.log
  # One result for both processes: runs concatenated, the test window from first start to last end.
  if ls "$OUT"/cypress-results-*.json >/dev/null 2>&1; then
    jq -s '{
      runs: (map(.runs // []) | add),
      startedTestsAt: (map(.startedTestsAt // empty) | min),
      endedTestsAt: (map(.endedTestsAt // empty) | max),
      totalFailed: (map(.totalFailed // 0) | add)
    }' "$OUT"/cypress-results-*.json >"$OUT/cypress-results.json"
  fi
fi
echo "> Cypress finished (exit $status)"
exit "$status"
