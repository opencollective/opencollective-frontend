#!/usr/bin/env bash
# Fresh Linux Playwright smoke launcher.
#
# One shared local/CI lifecycle with three modes:
#   fresh (default)  Preflight, restore the API dump + migrations into an
#                    explicitly owned disposable database, start services,
#                    verify semantic readiness, run the selected test, write a
#                    replay manifest, and tear down only owned processes.
#   --replay FILE    Validate the current checkouts against a recorded replay
#                    manifest (revisions, lockfiles, seed, runtime, browser)
#                    without touching them, adopt its selection unless
#                    overridden, then run as fresh. Replay recreates recorded
#                    inputs — including a fresh database and fresh provider
#                    resources — not historical provider state, and it cannot
#                    guarantee recurrence of an intermittent failure.
#   --reuse          Join the live owned environment for iteration: no reset of
#                    database, cache, mail, or files. Reports how it differs
#                    from fresh reproduction. Never tears down services.
#   --cleanup        Stop one retained owned environment (refuses while other
#                    runs still use it).
#
# Usage:
#   test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts
#   test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts --grep "switches language"
#   test/playwright/run-local.sh --replay test/playwright/.artifacts/<run-id>/replay-manifest.json
#   test/playwright/run-local.sh --reuse --spec test/playwright/specs/smoke.spec.ts
#   test/playwright/run-local.sh --cleanup
#   PLAYWRIGHT_WORKERS=2 test/playwright/run-local.sh
#   PLAYWRIGHT_RETRIES=1 test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts
#
# Canonical guide: docs/e2e.md. Runner details: test/playwright/README.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# --- Defaults (CI contract) ---
SPEC="${PLAYWRIGHT_SPEC:-test/playwright/specs/smoke.spec.ts}"
SPEC_SET=false
if [[ -n "${PLAYWRIGHT_SPEC:-}" ]]; then SPEC_SET=true; fi
GREP="${PLAYWRIGHT_GREP:-}"
GREP_SET=false
if [[ -n "${PLAYWRIGHT_GREP:-}" ]]; then GREP_SET=true; fi
WORKERS="${PLAYWRIGHT_WORKERS:-1}"
WORKERS_SET=false
if [[ -n "${PLAYWRIGHT_WORKERS:-}" ]]; then WORKERS_SET=true; fi
# Ticket 04: benchmarks run with zero retries; routine CI permits at most one
# retry so first-attempt failures stay distinguishable from recoveries.
RETRIES="${PLAYWRIGHT_RETRIES:-0}"
RETRIES_SET=false
if [[ -n "${PLAYWRIGHT_RETRIES:-}" ]]; then RETRIES_SET=true; fi
HEADED=false
HEADED_SET=false
KEEP_ON_FAILURE=false
MODE="fresh"
REPLAY_MANIFEST=""
REPLAY_REQUESTED=false
REUSE_REQUESTED=false
CLEANUP_ONLY=false

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
  echo "  --workers N            Browser workers (default: 1; positive integer)"
  echo "  --retries N            Playwright retries 0 or 1 (default: 0; CI uses 1 at most)"
  echo "  --headed               Run headed (debugging only)"
  echo "  --keep-on-failure      Retain owned processes/state on failure + print cleanup"
  echo "  --replay MANIFEST      Validate checkouts against a replay manifest, adopt its"
  echo "                         selection unless overridden, then run as fresh"
  echo "  --reuse                Join the live owned environment for iteration (no reset,"
  echo "                         never tears down services)"
  echo "  --cleanup              Stop the retained owned environment for --pg-database"
  echo "                         (refuses while other runs use it)"
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
      SPEC="$2"; SPEC_SET=true; shift 2 ;;
    --grep)
      GREP="$2"; GREP_SET=true; shift 2 ;;
    --workers)
      WORKERS="$2"; WORKERS_SET=true; shift 2 ;;
    --retries)
      RETRIES="$2"; RETRIES_SET=true; shift 2 ;;
    --headed)
      HEADED=true; HEADED_SET=true; shift ;;
    --keep-on-failure)
      KEEP_ON_FAILURE=true; shift ;;
    --replay)
      REPLAY_MANIFEST="$2"; REPLAY_REQUESTED=true; shift 2 ;;
    --reuse)
      REUSE_REQUESTED=true; shift ;;
    --cleanup)
      CLEANUP_ONLY=true; shift ;;
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

if [[ "$REUSE_REQUESTED" == true && "$REPLAY_REQUESTED" == true ]]; then
  echo "ERROR: --reuse and --replay cannot be combined." >&2
  exit 2
fi
if [[ "$REPLAY_REQUESTED" == true ]]; then
  MODE="replay"
elif [[ "$REUSE_REQUESTED" == true ]]; then
  MODE="reuse"
fi
if [[ "$CLEANUP_ONLY" == true ]] && [[ "$MODE" != "fresh" ]]; then
  echo "ERROR: --cleanup cannot be combined with --reuse or --replay." >&2
  exit 2
fi
if [[ "$MODE" == "reuse" && "$KEEP_ON_FAILURE" == true ]]; then
  echo "ERROR: --reuse owns no processes; --keep-on-failure applies to fresh runs only." >&2
  exit 2
fi
if ! [[ "$RETRIES" =~ ^[01]$ ]]; then
  echo "ERROR: --retries must be 0 or 1 (got '$RETRIES'). Benchmarks use 0; routine CI permits at most 1." >&2
  exit 2
fi
if ! [[ "$WORKERS" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: --workers must be a positive integer (got '$WORKERS')." >&2
  exit 2
fi

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
  if ! [[ "$name" =~ ^opencollective_pw_e2e(_[a-z0-9_]+)?$ ]]; then
    echo "ERROR: disposable Playwright database must be opencollective_pw_e2e or opencollective_pw_e2e_<suffix>." >&2
    exit 2
  fi
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
# Ticket 04: Playwright's own reports live inside the run-specific artifacts
# directory, so every attempt keeps original traces/screenshots/diagnostics
# without shared-path overwrite. The config honors these overrides; without
# them it falls back to test/playwright/report/ and test-results/.
PLAYWRIGHT_REPORT_DIR="$ARTIFACTS_DIR/report"
PLAYWRIGHT_OUTPUT_DIR="$ARTIFACTS_DIR/test-results"
export PLAYWRIGHT_REPORT_DIR PLAYWRIGHT_OUTPUT_DIR

sanitize() {
  # Strip likely secret values from logs/manifest diagnostics.
  sed -E -e 's/(SECRET[^= ]*=[^ ]+)/\1[redacted]/gI' -e 's/(whsec_[A-Za-z0-9_]+)/[redacted]/g' -e 's/(sk_test_[A-Za-z0-9_]+)/[redacted]/g' -e 's/(rk_test_[A-Za-z0-9_]+)/[redacted]/g'
}

fail() {
  echo "ERROR: $1" >&2
  echo "Evidence (if any): $ARTIFACTS_DIR" >&2
}

# --- Environment registry: ownership + active users (lock-free) ---
# One owner record per disposable database, plus one file per joined run in a
# sibling directory. The key is the disposable database name: one live owned
# environment per database, matching the fixed service ports (a second live
# stack cannot bind them anyway). Joiners only ever create and delete their own
# file, so concurrent runs need no locking. Records live under the frontend
# checkout (gitignored) and only ever describe environments this launcher owns.
REGISTRY_DIR="$FRONTEND_DIR/test/playwright/.environments"
RECORD_FILE="$REGISTRY_DIR/$PG_DATABASE.json"
USERS_DIR="$REGISTRY_DIR/$PG_DATABASE.users"
FIXTURE_OWNER_FILE="$REGISTRY_DIR/$PG_DATABASE.credentials"

record_api_url() {
  jq -r '.apiUrl // empty' "$RECORD_FILE" 2>/dev/null
}

live_env_refusal() {
  fail "environment '$PG_DATABASE' is already live (owner $(jq -r '.ownerRunId // empty' "$RECORD_FILE")). Join it with --reuse or stop it with --cleanup; a fresh run cannot reset another run's state."
}

registry_record_is_live() {
  local api
  [[ -f "$RECORD_FILE" ]] || return 1
  api="$(record_api_url)"
  [[ -n "$api" ]] || return 1
  curl -sf --max-time 10 "$api/status" >/dev/null 2>&1
}

prune_stale_joiners() {
  # Drop joiner entries whose process is gone (killed without cleanup).
  # NOTE: kernel PID recycling can theoretically keep a dead joiner's number
  # alive under an unrelated process; then the entry (and its refusal) stands
  # until that process exits. Refusal is fail-safe; see --cleanup guidance.
  local file pid
  [[ -d "$USERS_DIR" ]] || return 0
  for file in "$USERS_DIR"/*.json; do
    [[ -e "$file" ]] || continue
    pid="$(jq -r '.pid // 0' "$file" 2>/dev/null)"
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "> Pruning stale user entry: $(basename "$file" .json) (pid $pid gone)" >&2
      rm -f "$file"
    fi
  done
}

live_joiner_ids() {
  local file
  prune_stale_joiners
  [[ -d "$USERS_DIR" ]] || return 0
  for file in "$USERS_DIR"/*.json; do
    [[ -e "$file" ]] || continue
    basename "$file" .json
  done
}

record_owner_pid() {
  jq -r '.ownerPid // 0' "$RECORD_FILE" 2>/dev/null
}

record_age_seconds() {
  local mtime
  mtime="$(stat -c %Y "$RECORD_FILE" 2>/dev/null || echo 0)"
  echo $(( $(date +%s) - mtime ))
}

write_owner_record() {
  # May be called before services start (phase "restoring", pids unknown/zero)
  # and again once PIDS are known; always describes this run's ownership.
  mkdir -p "$REGISTRY_DIR" "$USERS_DIR"
  jq -n \
    --arg envName "$PG_DATABASE" \
    --arg ownerRunId "$RUN_ID" \
    --argjson ownerPid "$$" \
    --arg createdAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg phase "${1:-ready}" \
    --arg pgDatabase "$PG_DATABASE" \
    --arg pgHost "$PG_HOST" \
    --arg websiteUrl "$WEBSITE_URL" \
    --arg apiUrl "$API_URL" \
    --arg imagesUrl "$IMAGES_URL" \
    --arg pdfUrl "$PDF_SERVICE_URL" \
    --arg mailpitUrl "$MAILPIT_URL" \
    --arg s3Endpoint "$AWS_S3_ENDPOINT" \
    --arg redisUrl "${REDIS_URL:-}" \
    --argjson redisOwned "$([[ "$REDIS_STARTED_BY_SCRIPT" == true ]] && echo true || echo false)" \
    --argjson redisPort "${REDIS_PORT:-6380}" \
    --argjson apiPid "${PIDS[0]:-0}" \
    --argjson frontendPid "${PIDS[1]:-0}" \
    --argjson imagesPid "${PIDS[2]:-0}" \
    --argjson pdfPid "${PIDS[3]:-0}" \
    --arg manifest "$MANIFEST" \
    --arg frontendDir "$FRONTEND_DIR" \
    --arg apiDir "$API_DIR" \
    --arg imagesDir "$IMAGES_DIR" \
    --arg pdfDir "$PDF_DIR" \
    '{envName: $envName, ownerRunId: $ownerRunId, ownerPid: $ownerPid,
      createdAt: $createdAt, keepOnFailure: false, phase: $phase,
      pgDatabase: $pgDatabase, pgHost: $pgHost,
      websiteUrl: $websiteUrl, apiUrl: $apiUrl, imagesUrl: $imagesUrl,
      pdfUrl: $pdfUrl, mailpitUrl: $mailpitUrl, s3Endpoint: $s3Endpoint,
      redisUrl: $redisUrl, redisOwned: $redisOwned, redisPort: $redisPort,
      servicePids: {api: $apiPid, frontend: $frontendPid, images: $imagesPid, pdf: $pdfPid},
      manifest: $manifest,
      frontendDir: $frontendDir, apiDir: $apiDir, imagesDir: $imagesDir, pdfDir: $pdfDir}' \
    >"$RECORD_FILE.tmp" && mv "$RECORD_FILE.tmp" "$RECORD_FILE"
  echo "> Ownership record: $RECORD_FILE"
}

mark_record_retained() {
  [[ -f "$RECORD_FILE" ]] || return 0
  jq '.keepOnFailure = true | .phase = "retained"' "$RECORD_FILE" >"$RECORD_FILE.tmp" && mv "$RECORD_FILE.tmp" "$RECORD_FILE"
}

update_record_phase() {
  [[ -f "$RECORD_FILE" ]] || return 0
  if [[ "$(jq -r '.ownerRunId // empty' "$RECORD_FILE" 2>/dev/null)" != "$RUN_ID" ]]; then
    return 0
  fi
  jq --arg phase "$1" '.phase = $phase' "$RECORD_FILE" >"$RECORD_FILE.tmp" && mv "$RECORD_FILE.tmp" "$RECORD_FILE"
}

remove_owner_record() {
  rm -f "$RECORD_FILE" "$FIXTURE_OWNER_FILE"
  rm -rf "$USERS_DIR"
}

register_joiner() {
  mkdir -p "$USERS_DIR"
  jq -n \
    --arg runId "$RUN_ID" \
    --argjson pid "$$" \
    --arg joinedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg spec "$SPEC" \
    '{runId: $runId, pid: $pid, joinedAt: $joinedAt, spec: $spec}' \
    >"$USERS_DIR/$RUN_ID.json"
  echo "> Registered as active user $RUN_ID on environment '$PG_DATABASE'"
}

deregister_joiner() {
  rm -f "$USERS_DIR/$RUN_ID.json"
}

# --- Explicit cleanup of one retained owned environment ---
run_cleanup() {
  command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required for --cleanup." >&2; exit 2; }
  if [[ ! -f "$RECORD_FILE" ]]; then
    echo "ERROR: no owned environment '$PG_DATABASE' (no record at $RECORD_FILE)." >&2
    echo "Nothing to clean up." >&2
    exit 2
  fi
  local joiners owner
  joiners="$(live_joiner_ids)"
  owner="$(jq -r '.ownerRunId // empty' "$RECORD_FILE" 2>/dev/null)"
  if [[ -n "$joiners" ]]; then
    echo "ERROR: environment '$PG_DATABASE' (owner $owner) still has active users; refusing to stop it." >&2
    echo "$joiners" | sed 's/^/  - /' >&2
    echo "Retry when they finish. If a listed process is gone but its entry" >&2
    echo "remains, remove that entry file under $USERS_DIR and retry." >&2
    exit 2
  fi
  echo "> Stopping owned environment '$PG_DATABASE' (owner $owner)"
  local owner_pid age
  owner_pid="$(record_owner_pid)"
  age="$(record_age_seconds)"
  if [[ "$owner_pid" != "0" ]] && kill -0 "$owner_pid" 2>/dev/null && [[ "$age" -lt 3600 ]]; then
    echo "ERROR: environment '$PG_DATABASE' owner process ($owner, pid $owner_pid) may still be" >&2
    echo "running (record ${age}s old); refusing to stop its services underneath it." >&2
    echo "Retry when it finishes. If the owner is really stuck, stop that process" >&2
    echo "first (kill $owner_pid), then retry --cleanup." >&2
    exit 2
  fi
  if [[ "$owner_pid" != "0" ]] && kill -0 "$owner_pid" 2>/dev/null; then
    echo "WARNING: owner process $owner_pid is still alive; its services will be" | sanitize
    echo "stopped anyway because the record is stale. Stop that process too if stuck." | sanitize
  fi
  # PIDs are recycled by the kernel, so a stale record could point at an
  # unrelated live process. Only signal PIDs whose command line still looks
  # like one of our service trees (node/npm); anything else is left alone.
  pid_cmdline() {
    tr '\0' ' ' <"/proc/$1/cmdline" 2>/dev/null
  }
  local pid child cmd rc=0
  for pid in $(jq -r '.servicePids[] // empty' "$RECORD_FILE" 2>/dev/null); do
    [[ "$pid" == "0" ]] && continue
    if ! kill -0 "$pid" 2>/dev/null; then
      continue
    fi
    cmd="$(pid_cmdline "$pid")"
    if [[ "$cmd" != *node* && "$cmd" != *npm* ]]; then
      echo "WARNING: skipping pid $pid (no longer looks like a service: ${cmd:-<unreadable>})." | sanitize
      continue
    fi
    kill_tree "$pid"
  done
  sleep 2
  for pid in $(jq -r '.servicePids[] // empty' "$RECORD_FILE" 2>/dev/null); do
    [[ "$pid" == "0" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      cmd="$(pid_cmdline "$pid")"
      if [[ "$cmd" == *node* || "$cmd" == *npm* ]]; then
        kill -9 "$pid" 2>/dev/null || rc=1
      fi
    fi
    for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
      kill -9 "$child" 2>/dev/null || rc=1
    done
  done
  if [[ "$(jq -r '.redisOwned // false' "$RECORD_FILE" 2>/dev/null)" == true ]]; then
    redis-cli -p "$(jq -r '.redisPort // 6380' "$RECORD_FILE" 2>/dev/null)" shutdown nosave 2>/dev/null || true
  fi
  remove_owner_record
  if [[ $rc -ne 0 ]]; then
    echo "WARNING: some owned processes may survive; check ports 3000/3060/3001/3002." | sanitize
    exit 1
  fi
  echo "> Environment '$PG_DATABASE' stopped and record removed."
}

# --- Replay: validate current checkouts against a recorded manifest ---
# Never modifies checkouts: mismatches fail clearly instead of overwriting
# unrelated local changes. On success adopts the recorded selection for any
# axis the caller did not explicitly override.
apply_replay_manifest() {
  local manifest="$1"
  [[ -f "$manifest" ]] || { echo "ERROR: replay manifest not found: $manifest" >&2; exit 2; }
  jq empty "$manifest" 2>/dev/null || { echo "ERROR: replay manifest is not valid JSON: $manifest" >&2; exit 2; }

  local mismatches=()
  check_field() {
    # Fields absent from older manifests cannot be validated; only a recorded
    # value that disagrees with the current checkout is a mismatch.
    if [[ -n "$2" && "$2" != "$3" ]]; then
      mismatches+=("$1: recorded=[$2] current=[$3]")
    fi
  }
  check_field "frontendRev" "$(jq -r '.frontendRev // empty' "$manifest")" "$(git_rev "$FRONTEND_DIR")"
  check_field "apiRev" "$(jq -r '.apiRev // empty' "$manifest")" "$(git_rev "$API_DIR")"
  check_field "imagesRev" "$(jq -r '.imagesRev // empty' "$manifest")" "$(git_rev "$IMAGES_DIR")"
  check_field "pdfRev" "$(jq -r '.pdfRev // empty' "$manifest")" "$(git_rev "$PDF_DIR")"
  check_field "frontendLock" "$(jq -r '.frontendLock // empty' "$manifest")" "$(file_sha "$FRONTEND_DIR/package-lock.json")"
  check_field "apiLock" "$(jq -r '.apiLock // empty' "$manifest")" "$(file_sha "$API_DIR/package-lock.json")"
  check_field "seedSha256" "$(jq -r '.seedSha256 // empty' "$manifest")" "$(file_sha "$API_DIR/test/dbdumps/opencollective_dvl.pgsql")"
  check_field "migrationHead" "$(jq -r '.migrationHead // empty' "$manifest")" "$(migration_head "$API_DIR")"
  check_field "npm" "$(jq -r '.npm // empty' "$manifest")" "$(npm --version)"
  check_field "postgres" "$(jq -r '.postgres // empty' "$manifest")" "$(psql --version 2>/dev/null || echo unknown)"
  check_field "redis" "$(jq -r '.redis // empty' "$manifest")" "$(redis_version)"
  check_field "browserBuild" "$(jq -r '.browserBuild // empty' "$manifest")" "$(chromium_build)"
  # NOTE: recorded service URLs, checkout paths, pgDatabase/pgHost, and the
  # non-secret env block are intentionally NOT compared: host addresses, ports,
  # and paths may differ explicitly between local, worktree, and CI layouts
  # while preserving behavior. They are recorded for evidence, not identity.
  local rec_node rec_major cur_version cur_major
  rec_node="$(jq -r '.node // empty' "$manifest")"
  rec_major="${rec_node%%.*}"
  cur_version="$(node --version)"
  cur_major="${cur_version%%.*}"
  if [[ "$rec_major" != "$cur_major" ]]; then
    mismatches+=("node major: recorded=[$rec_node] current=[$cur_version]")
  elif [[ "$rec_node" != "$cur_version" ]]; then
    echo "> WARNING: node patch drift (recorded $rec_node, current $cur_version); replay proceeds."
  fi
  check_field "playwright" "$(jq -r '.playwright // empty' "$manifest")" \
    "$("$FRONTEND_DIR/node_modules/.bin/playwright" --version 2>/dev/null || echo unknown)"
  check_field "platform OS" "$(jq -r '.platform // empty' "$manifest" | cut -d/ -f1)" "$(uname -s)"

  if [[ ${#mismatches[@]} -gt 0 ]]; then
    echo "ERROR: replay inputs do not match; checkouts were not modified." >&2
    printf '  - %s\n' "${mismatches[@]}" >&2
    echo "Check out the recorded service revisions (without overwriting unrelated" >&2
    echo "local changes), rebuild, reinstall the recorded Playwright, and retry." >&2
    exit 2
  fi
  echo "> Replay inputs match recorded manifest."

  local pair name dir
  while IFS=: read -r name dir; do
    if ! git -C "$dir" diff --quiet HEAD 2>/dev/null; then
      echo "> WARNING: $name checkout has uncommitted tracked changes, which are"
      echo "  NOT part of the recorded inputs. Replay proceeds against recorded"
      echo "  revision $(git_rev "$dir") plus those local modifications."
    fi
  done <<EOF
frontend:$FRONTEND_DIR
api:$API_DIR
images:$IMAGES_DIR
pdf:$PDF_DIR
EOF

  local recorded
  if [[ "$SPEC_SET" != true ]]; then
    recorded="$(jq -r '.selection.spec // empty' "$manifest")"
    if [[ -n "$recorded" && "$recorded" != "null" ]]; then
      SPEC="$recorded"
    fi
  fi
  if [[ "$GREP_SET" != true ]]; then
    recorded="$(jq -r '.selection.grep // empty' "$manifest")"
    if [[ -n "$recorded" && "$recorded" != "null" ]]; then
      GREP="$recorded"
    fi
  fi
  if [[ "$WORKERS_SET" != true ]]; then
    recorded="$(jq -r '.selection.workers // empty' "$manifest")"
    if [[ -n "$recorded" && "$recorded" != "null" ]]; then
      WORKERS="$recorded"
    fi
  fi
  if [[ "$RETRIES_SET" != true ]]; then
    recorded="$(jq -r '.selection.retries // empty' "$manifest")"
    if [[ -n "$recorded" && "$recorded" != "null" ]]; then
      RETRIES="$recorded"
    fi
  fi
  if ! [[ "$RETRIES" =~ ^[01]$ ]]; then
    echo "ERROR: replay recorded retries '$RETRIES'; only 0 or 1 is supported." >&2
    exit 2
  fi
  if [[ "$HEADED_SET" != true ]]; then
    if [[ "$(jq -r '.selection.headed // false' "$manifest")" == true ]]; then
      HEADED=true
    fi
  fi
  if [[ ! -e "$FRONTEND_DIR/$SPEC" && ! -e "$SPEC" ]]; then
    fail "replay spec not found: $SPEC (recorded selection; override with --spec)"
    exit 2
  fi
  echo "> Replaying selection: spec=$SPEC grep=${GREP:-<none>} workers=$WORKERS retries=$RETRIES headed=$HEADED"
}

# --- Preflight (before changing any state) ---
preflight() {
  # redis-server is only required when this run may start its own disposable
  # Redis (no REDIS_URL). With REDIS_URL the Redis is supplied infrastructure
  # (e.g. the pinned CI service container) and is never owned or reset here.
  local tools=(node npm python3 psql pg_restore redis-cli curl jq git)
  if [[ -z "${REDIS_URL:-}" ]]; then
    tools+=(redis-server)
  fi
  local missing=()
  for tool in "${tools[@]}"; do
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
      if [[ -f "$RECORD_FILE" ]] && registry_record_is_live; then
        live_env_refusal
      else
        fail "port $port is already in use. Stop other servers first."
      fi
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
  local issues=0
  for pid in "${PIDS[@]}"; do
    kill_tree "$pid"
  done
  sleep 2
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
      issues=$((issues + 1))
    fi
    # Reap any remaining descendants of the original tree (routine; uncounted).
    for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
      kill -9 "$child" 2>/dev/null || true
    done
  done
  if [[ "$REDIS_STARTED_BY_SCRIPT" == true ]]; then
    redis-cli -p "$REDIS_PORT" shutdown nosave 2>/dev/null || issues=$((issues + 1))
  fi
  if [[ $issues -gt 0 ]]; then
    # Teardown trouble is reported but never masks the run's own outcome.
    echo "WARNING: owned teardown needed force on $issues process(es); check ports 3000/3060/3001/3002." | sanitize
  fi
  # Tearing down our services invalidates our ownership record (fresh mode
  # only; reuse mode returns early above, detach/retain paths skip cleanup).
  if [[ "${MODE:-fresh}" != "reuse" && -f "${RECORD_FILE:-}" ]] && \
     [[ "$(jq -r '.ownerRunId // empty' "$RECORD_FILE" 2>/dev/null)" == "${RUN_ID:-}" ]]; then
    remove_owner_record
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
  # Keep launcher credentials outside uploaded evidence. Reuse reads this same
  # private ownership proof; fresh/replay generate a new ephemeral token.
  (umask 077; node - "$FIXTURE_OWNER_FILE" "$RUN_ID" "$PG_DATABASE" <<'NODE'
const fs = require('fs');
const crypto = require('crypto');
const [file, ownerRunId, database] = process.argv.slice(2);
fs.writeFileSync(file, JSON.stringify({ownerRunId, database, token: crypto.randomBytes(32).toString('hex')}), {mode: 0o600});
fs.chmodSync(file, 0o600);
NODE
  )
  export E2E_FIXTURE_OWNER_FILE="$FIXTURE_OWNER_FILE"
  export PLAYWRIGHT_FIXTURE_OWNER_FILE="$FIXTURE_OWNER_FILE"
  export PLAYWRIGHT_RUN_ID="$RUN_ID"
  export PG_DATABASE
  export MAILPIT_CLIENT=true
  export WEBSITE_URL API_URL IMAGES_URL PDF_SERVICE_URL
  export API_KEY="${API_KEY:-dvl-1510egmf4a23d80342403fb599qd}"
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
  # The authenticated fixture route proves ownership and the built recipe
  # transport are available before any browser journey starts. Missing auth
  # must fail closed, even on a correctly launched disposable stack.
  local fixture_status
  fixture_status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/e2e/fixtures" -H 'Content-Type: application/json' -d '{}' || true)"
  if [[ "$fixture_status" != "401" ]]; then
    fail "fixture endpoint is unavailable or unguarded (HTTP $fixture_status). Rebuild the companion API branch and launch an owned disposable database."
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

redis_version() {
  # Identity evidence for the Redis in play: the launcher's own binary when it
  # may start one, otherwise the client that reaches the supplied Redis (CI
  # pins that service container by digest in the workflow).
  redis-server --version 2>/dev/null || redis-cli --version 2>/dev/null || echo "unknown"
}

file_sha() {
  sha256sum "$1" 2>/dev/null | awk '{print $1}' || echo "unknown"
}

chromium_build() {
  # Playwright-managed browser revision, e.g. chromium-1248.
  local dir
  dir="$(ls -d ~/.cache/ms-playwright/chromium-* 2>/dev/null | head -n 1)"
  [[ -n "$dir" ]] && basename "$dir" || echo "unknown"
}

migration_head() {
  # Latest API migration filename (timestamped 20*.js/20*.ts entries only;
  # the directory also holds helper subdirectories). The dump plus this
  # checkout's migrations are applied to the disposable target, so apiRev +
  # seedSha + this head pin the migration identity.
  local dir="$1/migrations" entry
  [[ -d "$dir" ]] || { echo "unknown"; return 0; }
  entry="$(ls "$dir" 2>/dev/null | grep -E '^20[0-9]+.*\.(js|ts)$' | tail -n 1)"
  [[ -n "$entry" ]] && echo "$entry" || echo "unknown"
}

MANIFEST_WRITTEN=false

write_manifest() {
  local playwright_exit="$1"
  local status="$2"
  local dump_file="$API_DIR/test/dbdumps/opencollective_dvl.pgsql"
  local spec_esc="${SPEC//\\/\\\\}"
  spec_esc="${spec_esc//\"/\\\"}"
  local grep_esc="${GREP//\\/\\\\}"
  grep_esc="${grep_esc//\"/\\\"}"
  local replay_json="null"
  if [[ "$MODE" == "replay" && -n "${REPLAY_MANIFEST:-}" && -f "${REPLAY_MANIFEST:-}" ]]; then
    local rm_esc="${REPLAY_MANIFEST//\\/\\\\}"
    rm_esc="${rm_esc//\"/\\\"}"
    local rrun
    rrun="$(jq -r '.runId // empty' "$REPLAY_MANIFEST" 2>/dev/null)"
    replay_json="{\"manifest\": \"$rm_esc\", \"runId\": \"$rrun\"}"
  fi
  local owner_json="null"
  if [[ -n "${OWNER_RUN_ID:-}" ]]; then
    owner_json="\"$OWNER_RUN_ID\""
  fi
  cat >"$MANIFEST" <<EOF
{
  "runId": "$RUN_ID",
  "attempt": "1",
  "mode": "$MODE",
  "envName": "$PG_DATABASE",
  "replaySource": $replay_json,
  "ownerRunId": $owner_json,
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
  "migrationHead": "$(migration_head "$API_DIR")",
  "node": "$(node --version)",
  "npm": "$(npm --version)",
  "playwright": "$("$FRONTEND_DIR/node_modules/.bin/playwright" --version 2>/dev/null || echo unknown)",
  "browser": "chromium (playwright-managed)",
  "browserBuild": "$(chromium_build)",
  "postgres": "$(psql --version 2>/dev/null || echo unknown)",
  "redis": "$(redis_version)",
  "selection": {"spec": "$spec_esc", "grep": "$grep_esc", "workers": "$WORKERS", "retries": "$RETRIES", "headed": $HEADED},
  "pgDatabase": "$PG_DATABASE",
  "pgHost": "${PG_HOST:-unknown}",
  "websiteUrl": "${WEBSITE_URL:-unknown}",
  "apiUrl": "${API_URL:-unknown}",
  "imagesUrl": "${IMAGES_URL:-unknown}",
  "pdfUrl": "${PDF_SERVICE_URL:-unknown}",
  "mailpitUrl": "${MAILPIT_URL:-unknown}",
  "s3Endpoint": "${AWS_S3_ENDPOINT:-unknown}",
  "env": {"TZ": "UTC", "OC_ENV": "ci", "NODE_ENV": "test", "E2E_TEST": "1"},
  "frontendDir": "$FRONTEND_DIR",
  "apiDir": "$API_DIR",
  "imagesDir": "$IMAGES_DIR",
  "pdfDir": "$PDF_DIR",
  "artifactsDir": "$ARTIFACTS_DIR"
}
EOF
  echo "> Replay manifest: $MANIFEST"
  MANIFEST_WRITTEN=true
}

main() {
  if [[ "$CLEANUP_ONLY" == true ]]; then
    run_cleanup
    exit $?
  fi
  if [[ "$MODE" == "reuse" ]]; then
    reuse_main
    exit $?
  fi
  fresh_main
  exit $?
}

# --- Exit handling: one trap preserves outcome + evidence on every path ---
PHASE="init"
INTERRUPTED=false
DETACH=false
JOINED=false

on_exit() {
  local ec=$?
  trap - EXIT INT TERM
  if ! redact_artifacts; then
    # Evidence trouble must not replace the original failure/cancellation code.
    [[ $ec -ne 0 ]] || ec=1
  fi
  if [[ "$MANIFEST_WRITTEN" != true && -d "${ARTIFACTS_DIR:-}" ]]; then
    if [[ "$INTERRUPTED" == true ]]; then
      write_manifest "null" "interrupted" || true
    elif [[ "$PHASE" != "init" && "$PHASE" != "done" ]]; then
      write_manifest "$ec" "setup-failed" || true
    fi
  fi
  if [[ "${JOINED:-false}" == true ]]; then
    deregister_joiner
    JOINED=false
  fi
  if [[ "$DETACH" != true ]]; then
    cleanup_owned
  fi
  exit "$ec"
}

redact_artifacts() {
  python3 "$FRONTEND_DIR/test/playwright/redact-artifacts.py" "$ARTIFACTS_DIR" "$FIXTURE_OWNER_FILE" "$REGISTRY_DIR/.private-artifacts/$RUN_ID"
}

run_playwright() {
  echo "> Running Playwright: $SPEC (workers=$WORKERS retries=$RETRIES)"
  local args=("$SPEC")
  if [[ -n "$GREP" ]]; then
    args+=(-g "$GREP")
  fi
  args+=(--workers="$WORKERS" --retries="$RETRIES")
  if [[ "$HEADED" == true ]]; then
    args+=(--headed)
  fi
  (cd "$FRONTEND_DIR" && npx playwright test "${args[@]}")
}

fresh_main() {
  trap on_exit EXIT
  trap 'INTERRUPTED=true; exit 130' INT
  trap 'INTERRUPTED=true; exit 143' TERM
  PHASE="preflight"
  preflight
  if [[ -n "$REPLAY_MANIFEST" ]]; then
    apply_replay_manifest "$REPLAY_MANIFEST"
  fi
  if [[ -f "$RECORD_FILE" ]]; then
    if registry_record_is_live; then
      live_env_refusal
      exit 2
    fi
    local owner_pid owner_phase
    owner_pid="$(record_owner_pid)"
    owner_phase="$(jq -r '.phase // empty' "$RECORD_FILE" 2>/dev/null)"
    if [[ "$owner_pid" != "0" ]] && kill -0 "$owner_pid" 2>/dev/null; then
      fail "environment '$PG_DATABASE' has an in-progress run (owner $(jq -r '.ownerRunId // empty' "$RECORD_FILE"), phase ${owner_phase:-unknown}, pid $owner_pid). Another fresh run is setting it up; join it later with --reuse or stop it with --cleanup."
      exit 2
    fi
    echo "> Removing stale record for '$PG_DATABASE'."
    remove_owner_record
  fi
  PHASE="restore"
  write_owner_record "restoring"
  ensure_redis
  setup_db
  PHASE="services"
  start_services
  write_owner_record "services"
  PHASE="readiness"

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
    exit "$pw_exit"
  fi

  update_record_phase "ready"
  PHASE="test"
  update_record_phase "testing"
  set +e
  run_playwright
  pw_exit=$?
  set -e
  if ! redact_artifacts; then
    [[ $pw_exit -ne 0 ]] || pw_exit=1
  fi

  if [[ $pw_exit -eq 0 ]]; then
    status="passed"
  else
    status="failed"
  fi
  PHASE="done"
  write_manifest "$pw_exit" "$status"

  if [[ "$KEEP_ON_FAILURE" == true && $pw_exit -ne 0 ]]; then
    mark_record_retained
    echo "> Keeping owned environment '$PG_DATABASE' for inspection (keep-on-failure)." | sanitize
    echo "  Artifacts: $ARTIFACTS_DIR" | sanitize
    echo "  Cleanup: ./test/playwright/run-local.sh --cleanup --pg-database $PG_DATABASE (from $FRONTEND_DIR)" | sanitize
    trap - EXIT
    exit "$pw_exit"
  fi

  local joiners
  joiners="$(live_joiner_ids)"
  if [[ -n "$joiners" ]]; then
    DETACH=true
    update_record_phase "detached"
    echo "> Detaching: environment '$PG_DATABASE' still has active users; services left running." | sanitize
    echo "$joiners" | sed 's/^/  - /' | sanitize
    echo "  Stop it later with: ./test/playwright/run-local.sh --cleanup --pg-database $PG_DATABASE" | sanitize
    trap - EXIT
    exit "$pw_exit"
  fi

  exit "$pw_exit"
}

reuse_main() {
  trap on_exit EXIT
  trap 'INTERRUPTED=true; exit 130' INT
  trap 'INTERRUPTED=true; exit 143' TERM
  PHASE="preflight"
  local missing=()
  for tool in node npx python3 curl jq; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    fail "missing required tools: ${missing[*]}. Install them and retry."
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
  if [[ ! -f "$RECORD_FILE" ]]; then
    fail "no owned environment '$PG_DATABASE'. Start one with a fresh run first."
    exit 2
  fi
  local api owner
  api="$(record_api_url)"
  owner="$(jq -r '.ownerRunId // empty' "$RECORD_FILE" 2>/dev/null)"
  if [[ -z "$api" ]] || ! curl -sf --max-time 10 "$api/status" >/dev/null 2>&1; then
    fail "environment '$PG_DATABASE' (owner $owner) is not live. Remove the stale record with --cleanup, or start fresh."
    exit 2
  fi
  OWNER_RUN_ID="$owner"
  WEBSITE_URL="$(jq -r '.websiteUrl // empty' "$RECORD_FILE")"
  API_URL="$api"
  if [[ ! -r "$FIXTURE_OWNER_FILE" ]]; then
    fail "fixture ownership proof missing. Start a fresh environment with the companion API build."
    exit 2
  fi
  export WEBSITE_URL API_URL
  export PLAYWRIGHT_FIXTURE_OWNER_FILE="$FIXTURE_OWNER_FILE"
  export PLAYWRIGHT_RUN_ID="$RUN_ID"
  register_joiner
  JOINED=true
  echo "> Reuse mode: attached to live environment '$PG_DATABASE' (owner $owner)."
  echo "> Differences from fresh reproduction: no database restore, no service"
  echo "  startup, no readiness gate; database, cache, mail, and files are shared"
  echo "  populated state. This run is registered as an active user, so the owner"
  echo "  cannot tear the environment down underneath it."
  PHASE="test"
  local pw_exit=0
  set +e
  run_playwright
  pw_exit=$?
  set -e
  if ! redact_artifacts; then
    [[ $pw_exit -ne 0 ]] || pw_exit=1
  fi
  PHASE="done"
  deregister_joiner
  JOINED=false
  if [[ $pw_exit -eq 0 ]]; then
    write_manifest "$pw_exit" "passed"
  else
    write_manifest "$pw_exit" "failed"
  fi
  exit "$pw_exit"
}

main "$@"
