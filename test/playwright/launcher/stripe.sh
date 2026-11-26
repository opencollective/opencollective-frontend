# Live Stripe test-mode prerequisites for journeys tagged @stripe. Sourced by
# run-local.sh, after its options, paths and fail/sanitize helpers.
#
# - The selection decides: when it holds @stripe tests, the run needs the
#   Stripe CLI and STRIPE_WEBHOOK_KEY to start a listener, and a probe proves
#   that a signed event for an object this API created reaches it through the
#   webhook ownership gate. Missing or broken prerequisites fail the run.
# - --without-stripe (PLAYWRIGHT_WITHOUT_STRIPE=1) excludes the @stripe tests
#   instead and says so: only for runs that cannot have credentials (fork PRs).
# - Selections without @stripe tests need nothing; when credentials are
#   present the listener still starts, so a later Stripe run can join.
#
# Same delivery as the Cypress CI job (scripts/run_e2e_tests.sh): one
# `stripe listen --forward-connect-to <api>/webhooks/stripe` per E2E
# environment, its signing secret given to the API. The key is passed through
# STRIPE_API_KEY, never on a command line, and evidence is redacted.

STRIPE_TAG="@stripe"
STRIPE_SELECTED=0
# not-selected | required | verified | excluded
STRIPE_MODE="not-selected"
STRIPE_PROBE_JSON="null"
STRIPE_LOG="$ARTIFACTS_DIR/stripe-listener.log"
STRIPE_LISTENER_PID=0

stripe_credentials_present() {
  [[ -n "${STRIPE_WEBHOOK_KEY:-}" ]] && command -v stripe >/dev/null 2>&1
}

# Counts the selected tests tagged @stripe with `playwright test --list`.
stripe_count_selected() {
  local args=() arg skip_value=false json
  if [[ "$MODE" == "iterate" ]]; then
    for arg in ${PW_ARGS[@]+"${PW_ARGS[@]}"}; do
      if [[ "$skip_value" == true ]]; then
        skip_value=false
        continue
      fi
      case "$arg" in
        --ui|--debug|--headed|--list|--reporter=*|--ui-host=*|--ui-port=*) ;;
        --reporter|--ui-host|--ui-port) skip_value=true ;;
        *) args+=("$arg") ;;
      esac
    done
  else
    args=("$SPEC")
    [[ -z "$GREP" ]] || args+=(-g "$GREP")
  fi
  json="$(cd "$FRONTEND_DIR" && npx playwright test --list --reporter=json ${args[@]+"${args[@]}"} 2>"$ARTIFACTS_DIR/stripe-selection.log" || true)"
  # Playwright reports tags without their "@" in JSON; a selection it cannot list counts none and fails in Playwright.
  STRIPE_SELECTED="$(jq '[.. | objects | select(has("tests") and has("tags")) | select(any(.tags[]; . == "stripe" or . == "@stripe"))] | length' <<<"$json" 2>/dev/null || echo 0)"
  [[ "$STRIPE_SELECTED" =~ ^[0-9]+$ ]] || STRIPE_SELECTED=0
}

stripe_plan() {
  stripe_count_selected
  if [[ "$STRIPE_SELECTED" -eq 0 ]]; then
    STRIPE_MODE="not-selected"
    echo "> Stripe: no selected test is tagged $STRIPE_TAG; no Stripe prerequisites needed."
  elif [[ "$WITHOUT_STRIPE" == true ]]; then
    STRIPE_MODE="excluded"
    echo "> STRIPE COVERAGE UNAVAILABLE: $STRIPE_SELECTED selected $STRIPE_TAG test(s) excluded (--without-stripe)."
    echo "  They did not run. Reviewed trusted coverage on the same revision must run them."
  else
    STRIPE_MODE="required"
    echo "> Stripe: $STRIPE_SELECTED selected test(s) tagged $STRIPE_TAG need live Stripe test mode."
  fi
}

# Before this run starts an API: the listener needs the CLI and the key.
stripe_require_credentials() {
  [[ "$STRIPE_MODE" == "required" ]] || return 0
  local missing=()
  [[ -n "${STRIPE_WEBHOOK_KEY:-}" ]] || missing+=("STRIPE_WEBHOOK_KEY (a test-mode restricted key with \"Debugging tools\" write access)")
  command -v stripe >/dev/null 2>&1 || missing+=("the Stripe CLI on PATH (https://docs.stripe.com/stripe-cli)")
  if [[ ${#missing[@]} -gt 0 ]]; then
    fail "the selection holds $STRIPE_SELECTED $STRIPE_TAG test(s), which need live Stripe webhooks. Missing: $(IFS=';'; echo "${missing[*]}" | sed 's/;/; /g').
  Provide them (docs/e2e.md, \"Live Stripe journeys\"), select other tests, or exclude the Stripe tests explicitly with --without-stripe."
    exit 2
  fi
}

# The listener's signing secret, which the API needs at startup.
stripe_signing_secret() {
  [[ "$WITHOUT_STRIPE" != true ]] && stripe_credentials_present || return 0
  local secret
  secret="$(STRIPE_API_KEY="$STRIPE_WEBHOOK_KEY" stripe listen --print-secret 2>>"$STRIPE_LOG" || true)"
  if [[ "$secret" != whsec_* ]]; then
    if [[ "$STRIPE_MODE" == "required" ]]; then
      fail "the Stripe CLI could not open a listener session with STRIPE_WEBHOOK_KEY (see $STRIPE_LOG). Check the key is a valid test-mode key."
      exit 1
    fi
    echo "> WARNING: the Stripe CLI could not open a listener session (see $STRIPE_LOG); no Stripe webhooks for this E2E environment."
    return 0
  fi
  export STRIPE_WEBHOOK_SIGNING_SECRET="$secret"
}

# Forwards the Stripe account's Connect events to this API. Owned like a service.
start_stripe_listener() {
  [[ "${STRIPE_WEBHOOK_SIGNING_SECRET:-}" == whsec_* ]] && stripe_credentials_present || return 0
  local detach=()
  [[ "$MODE" != "iterate" ]] || detach=(setsid)
  echo "> Starting Stripe listener (Connect events -> $API_URL/webhooks/stripe)"
  (STRIPE_API_KEY="$STRIPE_WEBHOOK_KEY" exec ${detach[@]+"${detach[@]}"} stripe listen --forward-connect-to "$API_URL/webhooks/stripe") >>"$STRIPE_LOG" 2>&1 &
  STRIPE_LISTENER_PID=$!
  PIDS[4]=$STRIPE_LISTENER_PID
}

wait_for_stripe_listener() {
  local pid="$1" start
  start=$(date +%s)
  echo "> Waiting for the Stripe listener (up to 60s)"
  until grep -q "Ready!" "$STRIPE_LOG" 2>/dev/null; do
    if ! kill -0 "$pid" 2>/dev/null; then
      fail "the Stripe listener exited before it was ready. See $STRIPE_LOG"
      return 1
    fi
    if [[ $(( $(date +%s) - start )) -ge 60 ]]; then
      fail "the Stripe listener was not ready within 60s. See $STRIPE_LOG"
      return 1
    fi
    sleep 1
  done
}

# Semantic readiness for @stripe tests: test-mode API configuration, signing
# secret, a usable shared host connection and a signed event delivered to this
# API's owned event path (see the API's server/e2e/stripe-ownership.ts).
stripe_readiness() {
  [[ "$STRIPE_MODE" == "required" ]] || return 0
  if [[ "$STRIPE_LISTENER_PID" != "0" ]]; then
    wait_for_stripe_listener "$STRIPE_LISTENER_PID" || return 1
  elif [[ -f "$RECORD_FILE" ]]; then
    local recorded
    recorded="$(jq -r '.servicePids.stripe // 0' "$RECORD_FILE" 2>/dev/null)"
    if [[ "$recorded" == "0" ]] || ! kill -0 "$recorded" 2>/dev/null; then
      fail "the running E2E environment has no Stripe listener, which the $STRIPE_SELECTED selected $STRIPE_TAG test(s) need.
  Restart it with STRIPE_WEBHOOK_KEY set and the Stripe CLI installed: npm run e2e -- --fresh$(db_flag) <spec>"
      return 1
    fi
  fi
  echo "> Probing Stripe: a signed event for an object this API creates must reach it (up to 60s)"
  local token response code body
  token="$(jq -r '.token // empty' "$FIXTURE_OWNER_FILE" 2>/dev/null)"
  response="$(curl -s --max-time 90 -w '\n%{http_code}' -X POST "$API_URL/e2e/stripe/probe" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"timeoutMs":60000}' || true)"
  code="${response##*$'\n'}"
  body="${response%$'\n'*}"
  if [[ "$code" != "200" ]]; then
    fail "Stripe readiness failed (HTTP ${code:-none}): $(jq -r '"\(.error.code): \(.error.message)"' <<<"$body" 2>/dev/null || echo "$body" | head -c 300)
  Listener log: $STRIPE_LOG (only when this run started the E2E environment). A provider outage is a failure too." 2>&1 | sanitize >&2
    return 1
  fi
  STRIPE_PROBE_JSON="$(jq -c '{account, customer, event, deliveredMs}' <<<"$body")"
  STRIPE_MODE="verified"
  echo "> Stripe ready: $(jq -r '"signed \(.event) for probe customer \(.customer) on \(.account) delivered in \(.deliveredMs) ms"' <<<"$body")"
}

# Arguments run_playwright adds, and what the fixtures check.
stripe_playwright_args() {
  STRIPE_PW_ARGS=()
  if [[ "$STRIPE_MODE" == "excluded" ]]; then
    if [[ " ${PW_ARGS[*]-} " == *" --grep-invert"* ]]; then
      fail "--without-stripe adds its own --grep-invert $STRIPE_TAG; drop yours or the Stripe tests would run."
      exit 2
    fi
    STRIPE_PW_ARGS=(--grep-invert "$STRIPE_TAG")
  fi
  export PLAYWRIGHT_STRIPE="$STRIPE_MODE"
}
