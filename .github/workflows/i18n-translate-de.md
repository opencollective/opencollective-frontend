---
emoji: 🇩🇪
name: i18n Translate German
description: Weekly batch of German frontend locale strings that still match English, opened as a reviewable pull request.
intent: Reduce remaining German frontend locale strings that still match English so German-speaking users see translated UI copy.
engine: copilot
model: gpt-5.6-luna
on:
  schedule: weekly on sunday
  workflow_dispatch:
  skip-if-match: 'is:pr is:open "gh-aw-workflow-id: i18n-translate-de" in:body'
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: none
timeout-minutes: 45
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
skills:
  - .agents/skills/i18n-frontend-translate
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
  - name: Prefetch untranslated German strings
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: |
      mkdir -p /tmp/gh-aw/data
      npx tsx scripts/i18n/show-untranslated.ts de --limit 30 > /tmp/gh-aw/data/untranslated-de.txt
      wc -l < /tmp/gh-aw/data/untranslated-de.txt | tr -d ' ' > /tmp/gh-aw/data/untranslated-count.txt
      gh pr list --state merged --search '[i18n-de]' --limit 3 \
        --json number,title,url,mergedAt \
        > /tmp/gh-aw/data/recent-i18n-prs.json
safe-outputs:
  create-pull-request:
    title-prefix: '[i18n-de] '
    reviewers: [znarf]
    draft: false
    max: 1
    expires: 21
    if-no-changes: ignore
    allowed-files:
      - lang/de.json
      - scripts/i18n/translation-stats.ts
      - lib/constants/locales.js
  jobs:
    post-slack-summary:
      description: Post a German i18n run summary to Slack
      inputs:
        message:
          description: Slack summary with batch counts, IGNORED ids, and the pull request URL when one was opened
          required: true
          type: string
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      steps:
        - name: Post to Slack
          env:
            SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          run: |
            set -euo pipefail
            if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
              echo "SLACK_WEBHOOK_URL is not set; skipping Slack post"
              exit 0
            fi
            MESSAGE=$(jq -r '[.items[] | select(.type == "post_slack_summary") | .message] | last // empty' "$GH_AW_AGENT_OUTPUT")
            if [ -z "$MESSAGE" ]; then
              echo "No Slack message in agent output; skipping"
              exit 0
            fi
            jq -n --arg text "$MESSAGE" '{text:$text}' \
              | curl -sS -f -X POST -H 'Content-type: application/json' --data @- "$SLACK_WEBHOOK_URL"
evals:
  - id: translates_when_backlog
    question: If untranslated German strings were listed, does the agent output show set-translation or IGNORED updates and a create_pull_request call? If the untranslated list was empty, answer UNKNOWN.
  - id: noop_when_caught_up
    question: If the untranslated German list was empty, does the agent output show noop and no create_pull_request? If strings were listed, answer UNKNOWN.
  - id: scoped_files
    question: Does the agent output show file changes limited to lang/de.json, scripts/i18n/translation-stats.ts, and lib/constants/locales.js?
---

# i18n Translate German

## Task

Objective: Reduce remaining German frontend locale strings that still match English so German-speaking users see translated UI copy.

Activation: this Sunday (or manual) run, after Node dependencies are installed. Required evidence is `/tmp/gh-aw/data/untranslated-de.txt` (up to 30 lines of `{id}: {english}`) and `/tmp/gh-aw/data/untranslated-count.txt`. Follow the `i18n-frontend-translate` skill. Locale is `de`.

Required effects when the prefetch file has at least one line:

1. Translate or ignore **only that batch**. Do not drain the full backlog.
2. Read recently merged PRs in `/tmp/gh-aw/data/recent-i18n-prs.json` for terminology, then match existing `lang/de.json`.
3. Apply translations with `npx tsx scripts/i18n/set-translation.ts de <id> "..."`.
4. For strings that should stay English, add the **message id** to `IGNORED.de` in `scripts/i18n/translation-stats.ts` with a short comment. Do not call `set-translation` for those ids.
5. Run `npm run langs:update-progress` once after the batch.
6. Open one pull request via `create_pull_request` (reviewer `znarf` is assigned automatically). Title starts with `[i18n-de] `. Body: batch size, translated vs IGNORED counts, notable IGNORED ids, and remaining-backlog note.
7. Call `post_slack_summary` with the same summary plus the PR URL.

No-op: if the prefetch file is empty, or the batch produces no file changes, call `noop` with a short reason and still call `post_slack_summary` (no PR). Do not create an empty pull request.

Do not merge the pull request. Do not edit files outside `lang/de.json`, `scripts/i18n/translation-stats.ts`, and `lib/constants/locales.js`. Use `gh` for GitHub reads. Use configured safe outputs for all writes.

## Safe Outputs

- `create_pull_request` when the batch changed allowed files.
- `post_slack_summary` on every completed run (including noop).
- `noop` when German is already caught up or nothing changed.
