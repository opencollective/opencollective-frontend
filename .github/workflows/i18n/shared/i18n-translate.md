---
import-schema:
  locale:
    type: string
    required: true
    description: Locale code (e.g. de, fr, es, pt-BR)
  language:
    type: string
    required: true
    description: English language name for prompts (e.g. German, French)
network:
  allowed:
    - defaults
    - github
    - node
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
  timeout: 120
cache:
  key: node-modules-${{ hashFiles('package-lock.json') }}
  path: node_modules
  restore-keys: |
    node-modules-
steps:
  - name: Setup Node.js
    uses: actions/setup-node@v7
    with:
      node-version-file: package.json
      cache: npm
  - name: Install dependencies
    run: CYPRESS_INSTALL_BINARY=0 npm ci --prefer-offline --no-audit
  - name: Prefetch untranslated ${{ github.aw.import-inputs.language }} strings
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: |
      mkdir -p /tmp/gh-aw/data
      npx tsx scripts/i18n/show-untranslated.ts ${{ github.aw.import-inputs.locale }} > /tmp/gh-aw/data/untranslated-${{ github.aw.import-inputs.locale }}.txt
      wc -l < /tmp/gh-aw/data/untranslated-${{ github.aw.import-inputs.locale }}.txt | tr -d ' ' > /tmp/gh-aw/data/untranslated-count.txt
      gh pr list --state merged --search '[i18n-${{ github.aw.import-inputs.locale }}]' --limit 3 \
        --json number,title,url,mergedAt \
        > /tmp/gh-aw/data/recent-i18n-prs.json
safe-outputs:
  create-pull-request:
    title-prefix: '[i18n-${{ github.aw.import-inputs.locale }}] '
    reviewers: [znarf]
    draft: false
    max: 1
    expires: 21
    if-no-changes: ignore
    allowed-files:
      - lang/${{ github.aw.import-inputs.locale }}.json
      - scripts/i18n/translation-stats.ts
      - lib/constants/locales.js
  jobs:
    post-slack-summary:
      description: Post an i18n run summary to Slack
      inputs:
        message:
          description: Slack summary with translated and IGNORED counts, IGNORED ids, and the pull request URL when one was opened
          required: true
          type: string
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      steps:
        # Use the small fallback artifact only. Merging with the full `agent` artifact
        # overwrites agent_output.json and can leave a non-JSON file at the expected path.
        - name: Download agent output fallback
          continue-on-error: true
          uses: actions/download-artifact@v8
          with:
            name: agent-output-fallback
            path: ${{ runner.temp }}/gh-aw/safe-jobs/
        - name: Post to Slack
          env:
            SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          run: |
            set -euo pipefail
            if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
              echo "SLACK_WEBHOOK_URL is not set; skipping Slack post"
              exit 0
            fi
            slack_message_from_agent_json() {
              local path="$1"
              [ -f "$path" ] || return 1
              jq -e . >/dev/null 2>&1 <"$path" || return 1
              jq -r '[.items[]? | select(.type == "post_slack_summary") | .message] | last // empty' "$path"
            }
            slack_message_from_ndjson_lines() {
              local path="$1"
              [ -f "$path" ] || return 1
              local line msg last=""
              while IFS= read -r line || [ -n "$line" ]; do
                [ -z "$line" ] && continue
                msg=$(jq -r 'if .type == "post_slack_summary" then .message else empty end' <<<"$line" 2>/dev/null) || continue
                [ -n "$msg" ] && last="$msg"
              done <"$path"
              [ -n "$last" ] && printf '%s' "$last"
            }
            SEARCH_ROOT="${RUNNER_TEMP}/gh-aw/safe-jobs"
            MESSAGE=""
            while IFS= read -r candidate; do
              msg=$(slack_message_from_ndjson_lines "$candidate" 2>/dev/null || true)
              [ -n "$msg" ] && MESSAGE="$msg"
            done < <(find "$SEARCH_ROOT" -type f -name 'safeoutputs.jsonl' 2>/dev/null | sort -u)
            if [ -z "$MESSAGE" ]; then
              while IFS= read -r candidate; do
                msg=$(slack_message_from_agent_json "$candidate" 2>/dev/null || true)
                if [ -z "$msg" ]; then
                  msg=$(slack_message_from_ndjson_lines "$candidate" 2>/dev/null || true)
                fi
                [ -n "$msg" ] && MESSAGE="$msg"
              done < <(find "$SEARCH_ROOT" -type f -name 'agent_output.json' 2>/dev/null | sort -u)
            fi
            if [ -z "$MESSAGE" ]; then
              echo "No Slack message in agent output (searched under ${SEARCH_ROOT}); skipping"
              exit 0
            fi
            PAYLOAD=$(jq -n --arg text "$MESSAGE" '{text:$text}')
            curl -sS -f -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$SLACK_WEBHOOK_URL"
---

# i18n Translate ${{ github.aw.import-inputs.language }}

## Task

Objective: Reduce remaining ${{ github.aw.import-inputs.language }} frontend locale strings that still match English so ${{ github.aw.import-inputs.language }}-speaking users see translated UI copy.

Activation: this Sunday (or manual) run, after Node dependencies are installed. Required evidence is `/tmp/gh-aw/data/untranslated-${{ github.aw.import-inputs.locale }}.txt` (every remaining `{id}: {english}` line) and `/tmp/gh-aw/data/untranslated-count.txt`. Follow the `i18n-frontend-translate` skill. Locale is `${{ github.aw.import-inputs.locale }}`.

Required effects when the prefetch file has at least one line:

1. Translate or ignore **every** id listed in `untranslated-${{ github.aw.import-inputs.locale }}.txt` (full backlog for this run).
2. Read recently merged PRs in `/tmp/gh-aw/data/recent-i18n-prs.json` for terminology, then match existing `lang/${{ github.aw.import-inputs.locale }}.json`.
3. Apply translations with `npx tsx scripts/i18n/set-translation.ts ${{ github.aw.import-inputs.locale }} <id> "..."`.
4. For strings that should stay English, add the **message id** to `IGNORED.${{ github.aw.import-inputs.locale }}` in `scripts/i18n/translation-stats.ts` with a short comment. Do not call `set-translation` for those ids.
5. Run `npm run langs:update-progress` once after all listed ids are handled.
6. Open one pull request via `create_pull_request` (reviewer `znarf` is assigned automatically). Title starts with `[i18n-${{ github.aw.import-inputs.locale }}] `. Body: prefetch count, translated vs IGNORED counts, notable IGNORED ids, and how many untranslated ids remain (re-run `show-untranslated.ts ${{ github.aw.import-inputs.locale }}` if needed).
7. Call `post_slack_summary` with the same summary plus the PR URL.

No-op: if the prefetch file is empty, or the run produces no file changes, call `noop` with a short reason and still call `post_slack_summary` (no PR). Do not create an empty pull request.

Do not merge the pull request. Do not edit files outside `lang/${{ github.aw.import-inputs.locale }}.json`, `scripts/i18n/translation-stats.ts`, and `lib/constants/locales.js`. Use `gh` for GitHub reads. Use configured safe outputs for all writes.

## Safe Outputs

- `create_pull_request` when the run changed allowed files.
- `post_slack_summary` on every completed run (including noop).
- `noop` when ${{ github.aw.import-inputs.language }} is already caught up or nothing changed.
