#!/usr/bin/env bash
# Benchmark scaffolding: one pilot benchmark pair on one machine. Runs both
# pilot suites with each runner, one runner after the other in the given
# order, on the same prepared builds and supplied services, with no retries.
#
# Usage: bench-pair.sh OUT_DIR BATCH PAIR MODE ORDER PLAYWRIGHT_WORKERS CYPRESS_PROCESSES [PLAYWRIGHT_ARTIFACTS]
#   ORDER is "cypress,playwright", "playwright,cypress" or a single runner.
#   PLAYWRIGHT_ARTIFACTS=off turns off trace and video recording, =novideo only
#   video (traces of failed attempts kept), by editing playwright.config.ts
#   for the run and restoring it afterwards. Configuration variants only.
# Writes OUT_DIR/run-<batch>-<pair>-<runner>.json (see `cli.ts collect-run`),
# timestamped logs, resource samples and machine facts.

set -uo pipefail

OUT="$1"
BATCH="$2"
PAIR="$3"
MODE="$4"
ORDER="$5"
PW_WORKERS="$6"
CY_PROCESSES="$7"
PW_ARTIFACTS="${8:-on}"
FRONTEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CLI=(node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "$FRONTEND/test/playwright/evaluation/cli.ts")
mkdir -p "$OUT"
cd "$FRONTEND"

# One Chromium binary for both runners.
CHROMIUM="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
{
  echo "batch=$BATCH pair=$PAIR mode=$MODE order=$ORDER playwrightWorkers=$PW_WORKERS cypressProcesses=$CY_PROCESSES playwrightArtifacts=$PW_ARTIFACTS"
  echo "nproc=$(nproc)"
  free -m
  echo "chromium=$CHROMIUM $("$CHROMIUM" --version 2>/dev/null)"
  echo "node=$(node --version) cypress=$(npx cypress --version --component package 2>/dev/null) playwright=$(npx playwright --version)"
  echo "frontend=$(git rev-parse HEAD) api=$(git -C "$API_FOLDER" rev-parse HEAD) images=$(git -C "$IMAGES_FOLDER" rev-parse HEAD) pdf=$(git -C "$PDF_FOLDER" rev-parse HEAD)"
  echo "lock=$(sha256sum package-lock.json | cut -c1-16) next=$(cat .next/BUILD_ID)"
} >"$OUT/machine.txt"

# CPU/memory/process samples every 5 s while the pair runs.
(
  printf 'epochMs\tload1\tmemUsedMB\tthreads\n'
  while true; do
    printf '%s\t%s\t%s\t%s\n' "$(date +%s%3N)" "$(cut -d' ' -f1 /proc/loadavg)" \
      "$(free -m | awk '/^Mem:/ {print $3}')" "$(ps -eLf --no-headers | wc -l)"
    sleep 5
  done
) >"$OUT/resources.tsv" &
SAMPLER=$!
trap 'kill "$SAMPLER" 2>/dev/null' EXIT

timestamp() {
  while IFS= read -r line; do
    printf '%s\t%s\n' "$(date +%s%3N)" "$line"
  done
}

run_runner() {
  local runner="$1" position="$2" log="$OUT/$runner.timeline.log" exit_code report artifacts concurrency
  local runner_out="$OUT/$runner"
  mkdir -p "$runner_out"
  {
    echo "BENCH start $runner"
    if [[ "$runner" == playwright && "$PW_ARTIFACTS" == off ]]; then
      sed -i "s/trace: .*/trace: 'off',/; s/video: 'retain-on-failure'/video: 'off'/" playwright.config.ts
      grep -nE "trace:|video:" playwright.config.ts
    elif [[ "$runner" == playwright && "$PW_ARTIFACTS" == novideo ]]; then
      sed -i "s/video: 'retain-on-failure'/video: 'off'/" playwright.config.ts
      grep -nE "trace:|video:" playwright.config.ts
    fi
    if [[ "$runner" == playwright ]]; then
      # The launcher accepts the path filter as a regular expression: both pilot directories.
      ./test/playwright/run-local.sh --spec 'test/playwright/specs/(expenses|vendors)/' \
        --workers "$PW_WORKERS" --retries 0 2>&1
    else
      bash test/playwright/evaluation/cypress-baseline.sh "$CY_PROCESSES" "$runner_out" "$CHROMIUM" 2>&1
    fi
    echo "BENCH end $runner exit=$?"
    git checkout -- playwright.config.ts
  } | timestamp | tee "$log"
  exit_code="$(sed -n 's/.*BENCH end [a-z]* exit=\([0-9]*\).*/\1/p' "$log" | tail -n 1)"
  if [[ "$runner" == playwright ]]; then
    artifacts="$(ls -td test/playwright/.artifacts/run-* 2>/dev/null | head -n 1)"
    report="$artifacts/report/results.json"
    concurrency="$PW_WORKERS"
  else
    # Failure screenshots are the Cypress shards' evidence (no video).
    mkdir -p "$runner_out/screenshots"
    cp -r test/cypress/screenshots/. "$runner_out/screenshots/" 2>/dev/null || true
    artifacts="$runner_out/screenshots"
    report="$runner_out/cypress-results.json"
    concurrency="$CY_PROCESSES"
  fi
  "${CLI[@]}" collect-run --runner "$runner" --mode "$MODE" --batch "$BATCH" --pair "$PAIR" \
    --position "$position" --concurrency "$concurrency" --exit-code "${exit_code:-1}" \
    --log "$log" --report "$report" --artifacts "$artifacts" \
    --job-url "${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}/attempts/${GITHUB_RUN_ATTEMPT:-}" \
    --out "$OUT/run-$BATCH-$PAIR-$runner.json"
  # Free the ports for the other runner even if teardown was incomplete.
  for port in 3000 3001 3002 3060; do
    fuser -k "$port/tcp" 2>/dev/null || true
  done
}

position=1
IFS=, read -r -a RUNNERS <<<"$ORDER"
for runner in "${RUNNERS[@]}"; do
  run_runner "$runner" "$position"
  position=$((position + 1))
done
