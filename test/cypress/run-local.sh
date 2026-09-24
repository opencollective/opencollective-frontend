#!/usr/bin/env bash
# Run Cypress E2E tests against a local production-like stack (monorepo / devcontainer).
#
# Usage:
#   ./test/cypress/run-local.sh --spec "test/cypress/integration/00-i18n.test.js"
#   ./test/cypress/run-local.sh --open
#   ./test/cypress/run-local.sh --setup-db --spec "test/cypress/integration/0*.(js|ts)"
#
# See test/cypress/README.md for prerequisites and other workflows.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"

API_DIR="${API_FOLDER:-$ROOT/opencollective-api}"
IMAGES_DIR="${IMAGES_FOLDER:-$ROOT/opencollective-images}"
PDF_DIR="${PDF_FOLDER:-$ROOT/opencollective-pdf}"

SETUP_DB=false
CYPRESS_MODE="run"
CYPRESS_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --setup-db)
      SETUP_DB=true
      shift
      ;;
    --open)
      CYPRESS_MODE="open"
      shift
      ;;
    --spec)
      CYPRESS_ARGS+=(--spec "$2")
      shift 2
      ;;
    --browser)
      CYPRESS_ARGS+=(--browser "$2")
      shift 2
      ;;
    --)
      shift
      CYPRESS_ARGS+=("$@")
      break
      ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      CYPRESS_ARGS+=("$1")
      shift
      ;;
  esac
done

USER_REDIS_URL="${REDIS_URL:-}"

if [[ ! -f "$FRONTEND_DIR/.next/BUILD_ID" ]]; then
  echo "Frontend is not built. Run: (cd $FRONTEND_DIR && npm run build)" >&2
  exit 1
fi

if [[ ! -f "$API_DIR/dist/e2e.js" ]]; then
  echo "API is not built. Run: (cd $API_DIR && npm run build)" >&2
  exit 1
fi

port_in_use() {
  (echo >/dev/tcp/localhost/"$1") >/dev/null 2>&1
}

for port in 3000 3060 3001 3002; do
  if port_in_use "$port"; then
    echo "Port $port is already in use. Stop dev servers first (e.g. npx pm2 stop all)." >&2
    exit 1
  fi
done

mkdir -p "$ROOT/logs"

REDIS_STARTED_BY_SCRIPT=false
REDIS_PORT="${REDIS_PORT:-6380}"
REDIS_DATA_DIR="$ROOT/logs/redis-e2e"

ensure_redis() {
  if ! command -v redis-server >/dev/null 2>&1 || ! command -v redis-cli >/dev/null 2>&1; then
    echo "Redis is required. Install redis-server (e.g. apt-get install redis-server)." >&2
    exit 1
  fi

  if [[ -n "$USER_REDIS_URL" ]]; then
    if ! redis-cli -u "$USER_REDIS_URL" ping >/dev/null 2>&1; then
      echo "Redis is not reachable at $USER_REDIS_URL" >&2
      exit 1
    fi
    export REDIS_URL="$USER_REDIS_URL"
    return
  fi

  mkdir -p "$REDIS_DATA_DIR"
  if redis-cli -p "$REDIS_PORT" ping >/dev/null 2>&1; then
    echo "> Using existing Redis on port $REDIS_PORT"
  else
    echo "> Starting Redis on port $REDIS_PORT (data dir: $REDIS_DATA_DIR, persistence disabled)"
    redis-server --daemonize yes --port "$REDIS_PORT" --dir "$REDIS_DATA_DIR" --save ""
    REDIS_STARTED_BY_SCRIPT=true
  fi
  export REDIS_URL="redis://localhost:${REDIS_PORT}"
}
ensure_redis

if getent hosts postgres >/dev/null 2>&1; then
  PG_HOST="${PG_HOST:-postgres}"
else
  PG_HOST="${PG_HOST:-localhost}"
fi

if getent hosts mailpit >/dev/null 2>&1; then
  MAILPIT_HOST="${MAILPIT_HOST:-mailpit}"
  MAILPIT_URL="${MAILPIT_URL:-http://mailpit:8025}"
else
  MAILPIT_HOST="${MAILPIT_HOST:-127.0.0.1}"
  MAILPIT_URL="${MAILPIT_URL:-http://localhost:1080}"
fi

if getent hosts minio >/dev/null 2>&1; then
  AWS_S3_ENDPOINT="${AWS_S3_ENDPOINT:-http://minio:9000}"
else
  AWS_S3_ENDPOINT="${AWS_S3_ENDPOINT:-http://localhost:9000}"
fi

export TZ=UTC
export OC_ENV=ci
export NODE_ENV=production
export E2E_TEST=1
export PG_HOST
export PG_DATABASE="${PG_DATABASE:-opencollective_e2e}"
export MAILPIT_CLIENT=true
export MAILPIT_HOST
export MAILPIT_URL
export MAILPIT_SMTP_PORT="${MAILPIT_SMTP_PORT:-1025}"
export AWS_KEY="${AWS_KEY:-user}"
export AWS_SECRET="${AWS_SECRET:-password}"
export AWS_S3_BUCKET="${AWS_S3_BUCKET:-opencollective-e2e}"
export AWS_S3_REGION="${AWS_S3_REGION:-us-east-1}"
export AWS_S3_ENDPOINT
export AWS_S3_SSL_ENABLED="${AWS_S3_SSL_ENABLED:-false}"
export AWS_S3_FORCE_PATH_STYLE="${AWS_S3_FORCE_PATH_STYLE:-true}"
export DISABLE_MOCK_UPLOADS="${DISABLE_MOCK_UPLOADS:-1}"
export GRAPHQL_ERROR_DETAILED="${GRAPHQL_ERROR_DETAILED:-true}"
export WEBSITE_URL="${WEBSITE_URL:-http://localhost:3000}"
export API_URL="${API_URL:-http://localhost:3060}"

PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  if [[ "$REDIS_STARTED_BY_SCRIPT" == true ]]; then
    redis-cli -p "$REDIS_PORT" shutdown nosave 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ "$SETUP_DB" == true ]]; then
  echo "> Restoring database ($PG_DATABASE)"
  (cd "$API_DIR" && PG_HOST="$PG_HOST" npm run db:restore:e2e && npm run db:migrate)
fi

wait_for() {
  local name=$1
  local url=$2
  echo "> Waiting for $name ($url)"
  for _ in $(seq 1 60); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "> $name is ready"
      return 0
    fi
    sleep 2
  done
  echo "> Timed out waiting for $name" >&2
  return 1
}

echo "> Starting API"
(cd "$API_DIR" && npm run start:e2e:server) >"$ROOT/logs/cypress-e2e-api.log" 2>&1 &
PIDS+=($!)

echo "> Starting frontend"
(cd "$FRONTEND_DIR" && npm run start:ci) >"$ROOT/logs/cypress-e2e-frontend.log" 2>&1 &
PIDS+=($!)

echo "> Starting images"
(cd "$IMAGES_DIR" && npm start) >"$ROOT/logs/cypress-e2e-images.log" 2>&1 &
PIDS+=($!)

echo "> Starting PDF"
(cd "$PDF_DIR" && PORT=3002 API_URL="$API_URL" npm start) >"$ROOT/logs/cypress-e2e-pdf.log" 2>&1 &
PIDS+=($!)

wait_for API "$API_URL/status"
wait_for Frontend "$WEBSITE_URL"
wait_for Images "http://localhost:3001"
wait_for PDF "http://localhost:3002"

if [[ ${#CYPRESS_ARGS[@]} -eq 0 ]] || ! printf '%s\n' "${CYPRESS_ARGS[@]}" | grep -q -- '--browser'; then
  if command -v chromium >/dev/null 2>&1; then
    CYPRESS_ARGS=(--browser chromium "${CYPRESS_ARGS[@]}")
  else
    CYPRESS_ARGS=(--browser electron "${CYPRESS_ARGS[@]}")
  fi
fi

echo "> Running Cypress ($CYPRESS_MODE)"
cd "$FRONTEND_DIR"

if [[ "$CYPRESS_MODE" == "open" ]]; then
  # Interactive UI: needs a display; skip xvfb when DISPLAY is set.
  if [[ -z "${DISPLAY:-}" ]] && command -v xvfb-run >/dev/null 2>&1; then
    exec xvfb-run -a npm run cypress:open -- --e2e "${CYPRESS_ARGS[@]}"
  else
    exec npm run cypress:open -- --e2e "${CYPRESS_ARGS[@]}"
  fi
else
  if command -v xvfb-run >/dev/null 2>&1; then
    exec xvfb-run -a npm run cypress:run -- "${CYPRESS_ARGS[@]}"
  else
    exec npm run cypress:run -- "${CYPRESS_ARGS[@]}"
  fi
fi
