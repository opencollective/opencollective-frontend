#!/usr/bin/env bash
# Benchmark scaffolding: independence checks for the complete pilots, run in CI
# by .github/workflows/e2e-pilot-benchmark.yml. Every launcher invocation is
# recorded as one JSON line in OUT/invocations.jsonl (label, exit code, run
# id, Playwright stats) next to its artifacts.
#
# Usage:
#   independence.sh OUT alone-fresh SHARD SHARDS  # each pilot test alone, fresh stack each
#   independence.sh OUT populated                 # one retained, populated stack:
#     controlled failure (fresh) -> probe run kept on failure -> each test alone
#     with --reuse -> varied concurrency and two concurrent joiners -> probe with
#     one retry (replacement workers) -> API fixture HTTP checks -> cleanup

set -uo pipefail

OUT="$1"
PHASE="$2"
FRONTEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAUNCHER="$FRONTEND/test/playwright/run-local.sh"
PILOTS='test/playwright/specs/(expenses|vendors)/'
mkdir -p "$OUT"
cd "$FRONTEND"

# "file<TAB>grep" for every pilot test; grep matches exactly one test title path.
pilot_tests() {
  npx playwright test --list --reporter=json 2>/dev/null | node -e '
    const report = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const walk = (suite, file, path) => {
      for (const spec of suite.specs ?? []) {
        if (/^(expenses|vendors)\//.test(file)) {
          console.log(`test/playwright/specs/${file}\t^${escape(["chromium", file, ...path, spec.title].join(" "))}$`);
        }
      }
      for (const child of suite.suites ?? []) walk(child, file, [...path, child.title]);
    };
    for (const suite of report.suites) walk(suite, suite.file, []);
  '
}

# record LABEL -- launcher args...: runs the launcher and appends one JSON line.
record() {
  local label="$1"
  shift 2
  local started exit_code artifacts results log
  log="$OUT/$(echo "$label" | tr -c 'A-Za-z0-9._-' '_' | cut -c1-100)-$(echo "$label" | md5sum | cut -c1-8).log"
  started=$(date +%s%3N)
  echo "::group::$label"
  "$@" >"$log" 2>&1
  exit_code=$?
  tail -n 25 "$log"
  echo "::endgroup::"
  # This invocation's own run directory, named by the launcher (joiners may run concurrently).
  artifacts="$(sed -n 's/.*Replay manifest: \(.*\)\/replay-manifest.json.*/\1/p' "$log" | tail -n 1)"
  results="$artifacts/report/results.json"
  jq -nc --arg label "$label" --argjson exit "$exit_code" --arg run "$(basename "$artifacts")" \
    --argjson ms "$(($(date +%s%3N) - started))" --arg log "$(basename "$log")" \
    --argjson stats "$( [[ -f "$results" ]] && jq -c .stats "$results" || echo null)" \
    --argjson unexpected "$( [[ -f "$results" ]] && jq -c '[.. | objects | select(has("specs")) | .specs[] | select(.tests[].status == "unexpected") | .title]' "$results" || echo '[]')" \
    --argjson flaky "$( [[ -f "$results" ]] && jq -c '[.. | objects | select(has("specs")) | .specs[] | select(.tests[].status == "flaky") | .title]' "$results" || echo '[]')" \
    '{label: $label, log: $log, exit: $exit, runId: $run, wallMs: $ms, stats: $stats, unexpected: $unexpected, flaky: $flaky}' \
    >>"$OUT/invocations.jsonl"
  return 0
}

free_ports() {
  for port in 3000 3001 3002 3060; do fuser -k "$port/tcp" 2>/dev/null || true; done
}

case "$PHASE" in
  alone-fresh)
    SHARD="$3"
    SHARDS="$4"
    index=0
    while IFS=$'\t' read -r file grep; do
      if ((index % SHARDS == SHARD - 1)); then
        record "fresh-alone #$index $grep" -- "$LAUNCHER" --spec "$file" --grep "$grep" --retries 0
        free_ports
      fi
      index=$((index + 1))
    done < <(pilot_tests)
    ;;

  populated)
    # A controlled failure from a fresh stack: its manifest and original
    # evidence are the input for the local replay check.
    record "controlled-failure process-expense" -- \
      env PLAYWRIGHT_ISOLATION_PROBE=1 "$LAUNCHER" --spec test/playwright/specs/expenses/process-expense.spec.ts --retries 0
    free_ports

    # Every pilot test on one fresh stack, probing tests failing after a real
    # change; the stack is kept, populated with every attempt's leftovers.
    record "probe-keep workers=3" -- \
      env PLAYWRIGHT_ISOLATION_PROBE=1 "$LAUNCHER" --spec "$PILOTS" --workers 3 --retries 0 --keep-on-failure

    while IFS=$'\t' read -r file grep; do
      record "populated-alone $grep" -- "$LAUNCHER" --reuse --spec "$file" --grep "$grep" --retries 0
    done < <(pilot_tests)

    for workers in 1 4; do
      record "populated-all workers=$workers" -- "$LAUNCHER" --reuse --spec "$PILOTS" --workers "$workers" --retries 0
    done

    # Two concurrent joiners, vendors and expenses at once, each with two workers.
    record "concurrent-joiners vendors" -- "$LAUNCHER" --reuse --spec test/playwright/specs/vendors --workers 2 --retries 0 &
    sleep 3
    record "concurrent-joiners expenses" -- "$LAUNCHER" --reuse --spec test/playwright/specs/expenses --workers 2 --retries 0
    wait

    # Failed first attempts, fresh replacement workers on retry.
    record "probe-retry workers=3" -- \
      env PLAYWRIGHT_ISOLATION_PROBE=1 "$LAUNCHER" --reuse --spec "$PILOTS" --workers 3 --retries 1

    # API fixture protocol checks against the retained stack: lost response,
    # partial creation rollback, interrupted setup beside a peer.
    (
      cd "$API_FOLDER" &&
        OC_ENV=ci NODE_CONFIG_ENV=ci NODE_ENV=test BABEL_ENV=test-fast PG_HOST=localhost \
          PG_DATABASE=opencollective_pw_e2e API_URL=http://localhost:3060 \
          PLAYWRIGHT_FIXTURE_OWNER_FILE="$FRONTEND/test/playwright/.environments/opencollective_pw_e2e.credentials" \
          npx mocha --no-config --require ./test/setup-babel.cjs --require ./test/setup-env.cjs --exit test/e2e/fixture-http.test.ts
    ) >"$OUT/api-fixture-http.log" 2>&1
    echo "{\"label\":\"api-fixture-http\",\"exit\":$?}" >>"$OUT/invocations.jsonl"
    tail -n 30 "$OUT/api-fixture-http.log"

    record "cleanup" -- "$LAUNCHER" --cleanup
    ;;
esac

jq -r '"\(.exit)\t\(.stats.expected // "-")/\(.stats.unexpected // "-")/\(.stats.flaky // "-")\t\(.label)"' "$OUT/invocations.jsonl"
