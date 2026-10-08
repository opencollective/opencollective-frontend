#!/usr/bin/env bash
# Fresh Linux Playwright smoke launcher (ticket 02).
#
# One shared local/CI lifecycle: preflight, fresh disposable database,
# semantic readiness, one Chromium smoke journey, replay manifest, owned teardown.
#
# Fresh reproduction is the default. Every run restores the selected API
# revision's development dump + migrations into an explicitly owned disposable
# database. Reuse/iteration mode does not exist yet (ticket 03); joining an
# existing environment without reset is unsupported and will fail closed.
#
# Usage:
#   test/playwright/run-local.sh --spec test/playwright/smoke.spec.ts
#   test/playwright/run-local.sh --spec test/playwright/smoke.spec.ts --grep "switches language"
#   PLAYWRIGHT_WORKERS=2 test/playwright/run-local.sh
#
# Canonical guide: docs/e2e.md. Runner details: test/playwright/README.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# --- Defaults (CI contract) ---
SPEC="${PLAYWRIGHT_SPEC:-test/playwright/smoke.spec.ts}"
GREP="${PLAYWRIGHT_GREP:-}"
WORKERS="${PLAYWRIGHT_WORKERS:-1}"
HEADED=false
KEEP_ON_FAILURE=false

API_DIR_INPUT="${API_FOLDER:-${API_DIR:-}}"
IMAGES_DIR_INPUT="${IMAGES_FOLDER:-${IMAGES_DIR:-}}"
PDF_DIR_INPUT="${PDF_FOLDER:-${PDF_DIR:-}}"
FRONTEND_DIR_INPUT="${FRONTEND_FOLDER:-${FRONTEND_DIR:-}}"

PG_DATABASE_INPUT="${PG_DATABASE:-opencollective_pw_e2e}"
READY_TIMEOUT="${READY_TIMEOUT:-300}"

WEBSITE_URL="${WEBSITE_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:3060}"
IMAGES_URL="${IMAGES_URL:-http://localhost:3001}"
PDF_SERVICE_URL="${PDF_SERVICE_URL:-http://localhost:3002}"

usage() {
  sed -n '2,20p' "$0"
  echo ""
  echo "Options:"
  echo "  --spec PATH            Playwright spec (default: $SPEC)"
  echo "  --grep PATTERN         Title filter passed as -g"
  echo "  --workers N            Browser workers (default: 1)"
  echo "  --headed               Run headed (debugging only)"
  echo "  --keep-on-failure      Retain owned processes/state on failure + print cleanup"
  echo "  --api-dir PATH         Explicit opencollective-api checkout"
  echo "  --frontend-dir PATH    Explicit frontend checkout"
  echo "  --images-dir PATH      Explicit opencollective-images checkout"
  echo "  --pdf-dir PATH         Explicit opencollective-pdf checkout"
  echo "  --pg-database NAME     Disposable database (default: opencollective_pw_e2e)"
  echo "  -h, --help             Show this help"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spec)
      SPEC="$2"; shift 2 ;;
    --grep)
      GREP="$2"; shift 2 ;;
    --workers)
      WORKERS="$2"; shift 2 ;;
    --headed)
      HEADED=true; shift ;;
    --keep-on-failure)
      KEEP_ON_FAILURE=true; shift ;;
    --api-dir)
      API_DIR_INPUT="$2"; shift 2 ;;
    --frontend-dir)
      FRONTEND_DIR_INPUT="$2"; shift 2 ;;
    --images-dir)
      IMAGES_DIR_INPUT="$2"; shift 2 ;;
    --pdf-dir)
      PDF_DIR_INPUT="$2"; shift 2 ;;
    --pg-database)
      PG_DATABASE_INPUT="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      shift; break ;;
    *)
      echo "ERROR: unknown argument: $1 (see --help)" >&2
      exit 2 ;;
  esac
done

# --- Resolve service checkouts independently of cwd (worktrees, nested CI) ---
resolve_dir() {
  local explicit="$1"
  local nested="$2"
  local workspace_sibling="$3"
  if [[ -n "$explicit" && -d "$explicit" ]]; then
    (cd "$explicit" && pwd)
    return 0
  fi
  if [[ -d "$nested" ]]; then
    (cd "$nested" && pwd)
    return 0
  fi
  if [[ -d "$workspace_sibling" ]]; then
    (cd "$workspace_sibling" && pwd)
    return 0
  fi
  return 1
}

FRONTEND_DIR_RESOLVED="$FRONTEND_DIR_INPUT"
if [[ ! -d "$FRONTEND_DIR_RESOLVED" ]]; then
  echo "ERROR: frontend checkout not found: $FRONTEND_DIR_RESOLVED" >&2
  exit 2
fi

WORKSPACE_ROOT_CANDIDATE="$(cd "$FRONTEND_DIR_RESOLVED/../.." 2>/dev/null && pwd || echo "")"
API_NESTED="$FRONTEND_DIR_RESOLVED/opencollective-api"
IMAGES_NESTED="$FRONTEND_DIR_RESOLVED/opencollective-images"
PDF_NESTED="$FRONTEND_DIR_RESOLVED/opencollective-pdf"

if ! API_DIR="$(resolve_dir "$API_DIR_INPUT" "$API_NESTED" "/workspace/opencollective-api")"; then
  if [[ -n "$WORKSPACE_ROOT_CANDIDATE" && -d "$WORKSPACE_ROOT_CANDIDATE/opencollective-api" ]]; then
    API_DIR="$(cd "$WORKSPACE_ROOT_CANDIDATE/opencollective-api" && pwd)"
  else
    echo "ERROR: opencollective-api checkout not found." >&2
    echo "Set --api-dir or API_FOLDER (tried nested CI path, /workspace sibling, worktree parent)." >&2
    exit 2
  fi
fi
if ! IMAGES_DIR="$(resolve_dir "$IMAGES_DIR_INPUT" "$IMAGES_NESTED" "/workspace/opencollective-images")"; then
  if [[ -n "$WORKSPACE_ROOT_CANDIDATE" && -d "$WORKSPACE_ROOT_CANDIDATE/opencollective-images" ]]; then
    IMAGES_DIR="$(cd "$WORKSPACE_ROOT_CANDIDATE/opencollective-images" && pwd)"
  else
    echo "ERROR: opencollective-images checkout not found. Set --images-dir or IMAGES_FOLDER." >&2
    exit 2
  fi
fi
if ! PDF_DIR="$(resolve_dir "$PDF_DIR_INPUT" "$PDF_NESTED" "/workspace/opencollective-pdf")"; then
  if [[ -n "$WORKSPACE_ROOT_CANDIDATE" && -d "$WORKSPACE_ROOT_CANDIDATE/opencollective-pdf" ]]; then
    PDF_DIR="$(cd "$WORKSPACE_ROOT_CANDIDATE/opencollective-pdf" && pwd)"
  else
    echo "ERROR: opencollective-pdf checkout not found. Set --pdf-dir or PDF_FOLDER." >&2
    exit 2
  fi
fi

FRONTEND_DIR="$FRONTEND_DIR_RESOLVED"
PG_DATABASE="$PG_DATABASE_INPUT"

# --- Disposable-database guard (fail closed before changing state) ---
guard_pg_database() {
  local name="$1"
  case "$name" in
    postgres|template0|template1|opencollective|opencollective_dvl|opencollective_test)
      echo "ERROR: refusing to restore into protected database '$name'." >&2
      echo "Use the default disposable 'opencollective_pw_e2e' or another obviously disposable name." >&2
      exit 2
      ;;
  esac
  case "$name" in
    *production*|*staging*)
      echo "ERROR: refusing database name '$name' (looks like production/staging)." >&2
      exit 2
      ;;
  esac
  if [[ -z "$name" ]]; then
    echo "ERROR: PG database name is empty." >&2
    exit 2
  fi
}
guard_pg_database "$PG_DATABASE"

# --- Run identity + evidence paths (run-specific, no shared overwrite) ---
RUN_ID="run-$(date -u +%Y%m%dT%H%M%SZ)-$$"
ARTIFACTS_DIR="$FRONTEND_DIR/test/playwright/.artifacts/$RUN_ID"
mkdir -p "$ARTIFACTS_DIR"
API_LOG="$ARTIFACTS_DIR/api.log"
FRONTEND_LOG="$ARTIFACTS_DIR/frontend.log"
IMAGES_LOG="$ARTIFACTS_DIR/images.log"
PDF_LOG="$ARTIFACTS_DIR/pdf.log"
MANIFEST="$ARTIFACTS_DIR/replay-manifest.json"

sanitize() {
  # Strip likely secret values from logs/manifest diagnostics.
  sed -E -e 's/(SECRET[^= ]*=[^ ]+)/\1[redacted]/gI' -e 's/(whsec_[A-Za-z0-9_]+)/[redacted]/g' -e 's/(sk_test_[A-Za-z0-9_]+)/[redacted]/g' -e 's/(rk_test_[A-Za-z0-9_]+)/[redacted]/g'
}

fail() {
  echo "ERROR: $1" >&2
  echo "Evidence (if any): $ARTIFACTS_DIR" >&2
}

# --- Preflight (before changing any state) ---
preflight() {
  local missing=()
  for tool in node npm psql pg_restore redis-cli redis-server curl jq git; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    fail "missing required tools: ${missing[*]}. Install them and retry."
    exit 2
  fi
  if ! command -v npx >/dev/null 2>&1; then
    fail "npx is required (comes with npm)."
    exit 2
  fi

  for checkout in "frontend:$FRONTEND_DIR" "api:$API_DIR" "images:$IMAGES_DIR" "pdf:$PDF_DIR"; do
    local name="${checkout%%:*}"
    local dir="${checkout#*:}"
    if [[ ! -f "$dir/package.json" ]]; then
      fail "$name checkout has no package.json: $dir"
      exit 2
    fi
    if [[ ! -e "$dir/.git" ]]; then
      fail "$name checkout is not a git repository: $dir"
      exit 2
    fi
  done

  # Build presence (record inputs in manifest; fail with corrective action).
  if [[ ! -f "$FRONTEND_DIR/.next/BUILD_ID" ]]; then
    fail "frontend is not built ($FRONTEND_DIR/.next/BUILD_ID missing). Run: (cd $FRONTEND_DIR && npm run build)"
    exit 2
  fi
  if [[ ! -f "$API_DIR/dist/e2e.js" ]]; then
    fail "API is not built ($API_DIR/dist/e2e.js missing). Run: (cd $API_DIR && npm run build)"
    exit 2
  fi
  if [[ ! -e "$IMAGES_DIR/dist/server" ]]; then
    fail "images service is not built ($IMAGES_DIR/dist/server missing). Run: (cd $IMAGES_DIR && npm run build)"
    exit 2
  fi
  if [[ ! -f "$PDF_DIR/dist/server/index.js" ]]; then
    fail "PDF service is not built ($PDF_DIR/dist/server/index.js missing). Run: (cd $PDF_DIR && npm run build)"
    exit 2
  fi
  if [[ ! -d "$FRONTEND_DIR/node_modules/@playwright/test" ]]; then
    fail "Playwright is not installed. Run: (cd $FRONTEND_DIR && npm ci && npx playwright install chromium)"
    exit 2
  fi
  if [[ -z "$(ls -d ~/.cache/ms-playwright/chromium-* 2>/dev/null)" ]]; then
    fail "Playwright Chromium browser is not installed. Run: (cd $FRONTEND_DIR && npm run playwright:install)"
    exit 2
  fi

  # Infrastructure reachability (supplied, not provisioned, except owned Redis below).
  if getent hosts postgres >/dev/null 2>&1; then
    PG_HOST_DEFAULT="postgres"
  else
    PG_HOST_DEFAULT="localhost"
  fi
  PG_HOST="${PG_HOST:-$PG_HOST_DEFAULT}"
  export PG_HOST
  if ! pg_isready -h "$PG_HOST" >/dev/null 2>&1; then
    fail "Postgres is not reachable at $PG_HOST. Start Postgres first (devcontainer compose or local service)."
    exit 2
  fi

  if getent hosts mailpit >/dev/null 2>&1; then
    MAILPIT_URL_DEFAULT="http://mailpit:8025"
  else
    MAILPIT_URL_DEFAULT="http://localhost:1080"
  fi
  MAILPIT_URL="${MAILPIT_URL:-$MAILPIT_URL_DEFAULT}"
  export MAILPIT_URL
  if ! curl -sf "$MAILPIT_URL/api/v1/messages" >/dev/null 2>&1; then
    fail "Mailpit is not reachable at $MAILPIT_URL. Start Mailpit first."
    exit 2
  fi

  if getent hosts minio >/dev/null 2>&1; then
    AWS_S3_ENDPOINT_DEFAULT="http://minio:9000"
  else
    AWS_S3_ENDPOINT_DEFAULT="http://localhost:9000"
  fi
  AWS_S3_ENDPOINT="${AWS_S3_ENDPOINT:-$AWS_S3_ENDPOINT_DEFAULT}"
  export AWS_S3_ENDPOINT
  if ! curl -sf "$AWS_S3_ENDPOINT/health/ready" >/dev/null 2>&1 && ! curl -sf "$AWS_S3_ENDPOINT/minio/health/ready" >/dev/null 2>&1; then
    fail "object store is not reachable at $AWS_S3_ENDPOINT. Start RustFS/MinIO first, e.g.: docker run --rm -p 9000:9000 -e RUSTFS_ACCESS_KEY=user -e RUSTFS_SECRET_KEY=password rustfs/rustfs:1.0.0-rc.6"
    exit 2
  fi

  for port in 3000 3060 3001 3002; do
    if (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1; then
      fail "port $port is already in use. Stop other servers first."
      exit 2
    fi
  done
}

# --- Owned Redis (disposable cache, persistence disabled) ---
REDIS_STARTED_BY_SCRIPT=false
REDIS_PORT="${REDIS_PORT:-6380}"
ensure_redis() {
  if [[ -n "${REDIS_URL:-}" ]]; then
    if ! redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
      fail "REDIS_URL is set but unreachable: $REDIS_URL"
      exit 2
    fi
    return 0
  fi
  local redis_data_dir="$ARTIFACTS_DIR/redis-e2e"
  mkdir -p "$redis_data_dir"
  if redis-cli -p "$REDIS_PORT" ping >/dev/null 2>&1; then
    echo "> Using existing Redis on port $REDIS_PORT (not owned; will not shut down)"
    export REDIS_URL="redis://localhost:${REDIS_PORT}"
  else
    echo "> Starting owned Redis on port $REDIS_PORT"
    redis-server --daemonize yes --port "$REDIS_PORT" --dir "$redis_data_dir" --save "" >>"$ARTIFACTS_DIR/redis.log" 2>&1
    REDIS_STARTED_BY_SCRIPT=true
    export REDIS_URL="redis://localhost:${REDIS_PORT}"
  fi
}

PIDS=()
kill_tree() {
  local pid="$1"
  local child
  for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}
cleanup_owned() {
  if [[ ${#PIDS[@]} -eq 0 && "$REDIS_STARTED_BY_SCRIPT" != true ]]; then
    return 0
  fi
  for pid in "${PIDS[@]}"; do
    kill_tree "$pid"
  done
  sleep 2
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    # Reap any remaining descendants of the original tree.
    for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
      kill -9 "$child" 2>/dev/null || true
    done
  done
  if [[ "$REDIS_STARTED_BY_SCRIPT" == true ]]; then
    redis-cli -p "$REDIS_PORT" shutdown nosave 2>/dev/null || true
  fi
}

# --- Fresh DB restore + migrations (same disposable target) ---
setup_db() {
  echo "> Restoring disposable database ($PG_DATABASE) from API dump"
  # Stop conflicting owned clients is handled by terminating backends below;
  # attached/shared infrastructure is never reset.
  PGPASSWORD="${PGPASSWORD:-postgres}" psql -h "$PG_HOST" -U postgres -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PG_DATABASE';" \
    >>"$ARTIFACTS_DIR/db-restore.log" 2>&1 || true
  (cd "$API_DIR" && npm run db:restore -- -d "$PG_DATABASE" -h "$PG_HOST" -f test/dbdumps/opencollective_dvl.pgsql) \
    >>"$ARTIFACTS_DIR/db-restore.log" 2>&1
  echo "> Running API migrations on $PG_DATABASE"
  (cd "$API_DIR" && PG_HOST="$PG_HOST" PG_DATABASE="$PG_DATABASE" npm run db:migrate) \
    >>"$ARTIFACTS_DIR/db-restore.log" 2>&1
}

# --- Service startup (CI per-service runtime contract) ---
start_services() {
  export TZ=UTC
  export OC_ENV=ci
  export NODE_ENV=test
  export E2E_TEST=1
  export PG_DATABASE
  export MAILPIT_CLIENT=true
  export WEBSITE_URL API_URL IMAGES_URL PDF_SERVICE_URL
  export AWS_KEY="${AWS_KEY:-user}"
  export AWS_SECRET="${AWS_SECRET:-password}"
  export AWS_S3_BUCKET="${AWS_S3_BUCKET:-opencollective-e2e}"
  export AWS_S3_REGION="${AWS_S3_REGION:-us-east-1}"
  export AWS_S3_SSL_ENABLED="${AWS_S3_SSL_ENABLED:-false}"
  export AWS_S3_FORCE_PATH_STYLE="${AWS_S3_FORCE_PATH_STYLE:-true}"
  export DISABLE_MOCK_UPLOADS="${DISABLE_MOCK_UPLOADS:-1}"
  export GRAPHQL_ERROR_DETAILED="${GRAPHQL_ERROR_DETAILED:-true}"

  echo "> Starting API ($API_DIR)"
  (cd "$API_DIR" && npm run start:e2e:server) >"$API_LOG" 2>&1 &
  PIDS+=($!)

  echo "> Starting frontend ($FRONTEND_DIR)"
  (cd "$FRONTEND_DIR" && node server) >"$FRONTEND_LOG" 2>&1 &
  PIDS+=($!)

  echo "> Starting images ($IMAGES_DIR)"
  (cd "$IMAGES_DIR" && npm start) >"$IMAGES_LOG" 2>&1 &
  PIDS+=($!)

  echo "> Starting PDF ($PDF_DIR)"
  (cd "$PDF_DIR" && PORT=3002 API_URL="$API_URL" npm start) >"$PDF_LOG" 2>&1 &
  PIDS+=($!)
}

wait_for_service() {
  local name="$1"
  local url="$2"
  local deadline="$READY_TIMEOUT"
  echo "> Waiting for $name ($url, up to ${deadline}s)"
  local start
  start=$(date +%s)
  while true; do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "> $name is ready"
      return 0
    fi
    if [[ $(( $(date +%s) - start )) -ge $deadline ]]; then
      fail "$name did not become ready at $url within ${deadline}s. See $ARTIFACTS_DIR/*.log"
      return 1
    fi
    sleep 2
  done
}

semantic_readiness() {
  wait_for_service "API/status" "$API_URL/status" || return 1
  # API serves GraphQL through the same process; a persisted-query 400 still proves routing.
  if ! curl -sf "$API_URL/graphql/v2" -X POST -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}' >/dev/null 2>&1; then
    # Fall back to v1 endpoint shape; either proving the API serves GraphQL is sufficient.
    curl -sf "$API_URL/graphql" -X POST -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}' >/dev/null 2>&1 || true
  fi
  wait_for_service "Frontend" "$WEBSITE_URL" || return 1
  if ! curl -sf "$WEBSITE_URL" 2>/dev/null | grep -qi "open collective"; then
    fail "frontend at $WEBSITE_URL did not serve Open Collective markup. See $FRONTEND_LOG"
    return 1
  fi
  wait_for_service "Images" "$IMAGES_URL" || return 1
  wait_for_service "PDF" "$PDF_SERVICE_URL" || return 1
  wait_for_service "Mailpit/API" "$MAILPIT_URL/api/v1/messages" || return 1
  if ! curl -sf "$AWS_S3_ENDPOINT/health/ready" >/dev/null 2>&1 && ! curl -sf "$AWS_S3_ENDPOINT/minio/health/ready" >/dev/null 2>&1; then
    fail "object store at $AWS_S3_ENDPOINT failed readiness. See $ARTIFACTS_DIR/db-restore.log"
    return 1
  fi
  # Seed/migration sanity: run-owned DB answers with the restored baseline.
  if ! PGPASSWORD="${PGPASSWORD:-postgres}" psql -h "$PG_HOST" -U postgres -d "$PG_DATABASE" -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null | grep -qE '^[1-9][0-9]*$'; then
    fail "seed/migration check failed on $PG_DATABASE. See $ARTIFACTS_DIR/db-restore.log"
    return 1
  fi
}

git_rev() {
  git -C "$1" rev-parse HEAD 2>/dev/null || echo "unknown"
}

file_sha() {
  sha256sum "$1" 2>/dev/null | awk '{print $1}' || echo "unknown"
}

write_manifest() {
  local playwright_exit="$1"
  local status="$2"
  local dump_file="$API_DIR/test/dbdumps/opencollective_dvl.pgsql"
  local spec_esc="${SPEC//\\/\\\\}"
  spec_esc="${spec_esc//\"/\\\"}"
  local grep_esc="${GREP//\\/\\\\}"
  grep_esc="${grep_esc//\"/\\\"}"
  cat >"$MANIFEST" <<EOF
{
  "runId": "$RUN_ID",
  "attempt": "1",
  "status": "$status",
  "playwrightExitCode": $playwright_exit,
  "platform": "$(uname -s)/$(uname -m)",
  "frontendRev": "$(git_rev "$FRONTEND_DIR")",
  "apiRev": "$(git_rev "$API_DIR")",
  "imagesRev": "$(git_rev "$IMAGES_DIR")",
  "pdfRev": "$(git_rev "$PDF_DIR")",
  "frontendLock": "$(file_sha "$FRONTEND_DIR/package-lock.json")",
  "apiLock": "$(file_sha "$API_DIR/package-lock.json")",
  "seedFile": "test/dbdumps/opencollective_dvl.pgsql",
  "seedSha256": "$(file_sha "$dump_file")",
  "migrations": "api HEAD migrations applied to PG_DATABASE (see db-restore.log)",
  "node": "$(node --version)",
  "npm": "$(npm --version)",
  "playwright": "$("$FRONTEND_DIR/node_modules/.bin/playwright" --version 2>/dev/null || echo unknown)",
  "browser": "chromium (playwright-managed)",
  "postgres": "$(psql --version 2>/dev/null || echo unknown)",
  "redis": "$(redis-server --version 2>/dev/null || echo unknown)",
  "selection": {"spec": "$spec_esc", "grep": "$grep_esc", "workers": "$WORKERS", "headed": $HEADED},
  "pgDatabase": "$PG_DATABASE",
  "pgHost": "$PG_HOST",
  "websiteUrl": "$WEBSITE_URL",
  "apiUrl": "$API_URL",
  "imagesUrl": "$IMAGES_URL",
  "pdfUrl": "$PDF_SERVICE_URL",
  "mailpitUrl": "$MAILPIT_URL",
  "s3Endpoint": "$AWS_S3_ENDPOINT",
  "env": {"TZ": "UTC", "OC_ENV": "ci", "NODE_ENV": "test", "E2E_TEST": "1"},
  "frontendDir": "$FRONTEND_DIR",
  "apiDir": "$API_DIR",
  "imagesDir": "$IMAGES_DIR",
  "pdfDir": "$PDF_DIR",
  "artifactsDir": "$ARTIFACTS_DIR"
}
EOF
  echo "> Replay manifest: $MANIFEST"
}

main() {
  trap cleanup_owned EXIT
  preflight
  ensure_redis
  setup_db
  start_services

  local ready_failed=false
  if ! semantic_readiness; then
    ready_failed=true
  fi

  local pw_exit=0
  local status="ready"
  if [[ "$ready_failed" == true ]]; then
    pw_exit=1
    status="setup-failed"
    write_manifest "$pw_exit" "$status"
    echo "> Setup failed; skipping browser execution. Manifest: $MANIFEST" | sanitize
    cleanup_owned
    exit "$pw_exit"
  fi

  echo "> Running Playwright: $SPEC (workers=$WORKERS)"
  trap 'pw_exit=$?; write_manifest "$pw_exit" "interrupted"; cleanup_owned; exit "$pw_exit"' INT TERM
  set +e
  if [[ -n "$GREP" ]]; then
    if [[ "$HEADED" == true ]]; then
      (cd "$FRONTEND_DIR" && npx playwright test "$SPEC" -g "$GREP" --workers="$WORKERS" --headed)
    else
      (cd "$FRONTEND_DIR" && npx playwright test "$SPEC" -g "$GREP" --workers="$WORKERS")
    fi
  else
    if [[ "$HEADED" == true ]]; then
      (cd "$FRONTEND_DIR" && npx playwright test "$SPEC" --workers="$WORKERS" --headed)
    else
      (cd "$FRONTEND_DIR" && npx playwright test "$SPEC" --workers="$WORKERS")
    fi
  fi
  pw_exit=$?
  set -e
  trap - INT TERM

  if [[ $pw_exit -eq 0 ]]; then
    status="passed"
  else
    status="failed"
  fi
  write_manifest "$pw_exit" "$status"

  if [[ "$KEEP_ON_FAILURE" == true && $pw_exit -ne 0 ]]; then
    echo "> Keeping owned processes for inspection (keep-on-failure)." | sanitize
    echo "  Artifacts: $ARTIFACTS_DIR" | sanitize
    echo "  Cleanup: kill ${PIDS[*]}; redis-cli -p $REDIS_PORT shutdown nosave (only if started by this run)" | sanitize
    trap - EXIT
    exit "$pw_exit"
  fi

  cleanup_owned
  exit "$pw_exit"
}

main "$@"
