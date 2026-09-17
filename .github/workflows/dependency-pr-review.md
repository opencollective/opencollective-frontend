---
emoji: 📦
name: Dependency PR Review
description: Review, test, and fix one frontend Renovate or Dependabot pull request when the agent-dependency-review label is applied.
intent: Keep Open Collective frontend dependency-update PRs reviewed, tested, and labeled so humans can merge or intervene.
engine: copilot
model: gpt-5.6-luna
on:
  label_command:
    name: agent-dependency-review
    events: [pull_request]
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  copilot-requests: none
timeout-minutes: 90
concurrency:
  job-discriminator: ${{ github.event.pull_request.number || github.event.issue.number || github.run_id }}
checkout:
  fetch-depth: 0
network:
  allowed:
    - defaults
    - github
    - node
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
  timeout: 600
skills:
  - .agents/skills/dependency-pr-review
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
  - name: Prefetch pull request metadata
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      PR_NUMBER: ${{ github.event.pull_request.number || github.event.issue.number || inputs.item_number }}
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/data
      if [ -z "${PR_NUMBER:-}" ]; then
        printf '%s\n' 'No pull request in this event; specialist requires a labeled dependency PR.' > /tmp/gh-aw/data/skip-reason.txt
        printf '%s\n' '' > /tmp/gh-aw/data/pr-number.txt
        printf '%s\n' '{}' > /tmp/gh-aw/data/pr.json
        printf '%s\n' '' > /tmp/gh-aw/data/pr-files.txt
        printf '%s\n' '[]' > /tmp/gh-aw/data/pr-checks.json
        exit 0
      fi
      printf '%s\n' "$PR_NUMBER" > /tmp/gh-aw/data/pr-number.txt
      gh pr view "$PR_NUMBER" --json number,title,url,author,body,labels,files,baseRefName,headRefName,isDraft,mergeable,commits \
        > /tmp/gh-aw/data/pr.json
      gh pr diff "$PR_NUMBER" --name-only > /tmp/gh-aw/data/pr-files.txt
      gh pr checks "$PR_NUMBER" --json name,state,bucket,workflow,link \
        > /tmp/gh-aw/data/pr-checks.json 2>/dev/null \
        || printf '%s\n' '[]' > /tmp/gh-aw/data/pr-checks.json
safe-outputs:
  push-to-pull-request-branch:
    target: triggering
    max: 1
    if-no-changes: ignore
    fallback-as-pull-request: false
    protected-files:
      policy: blocked
      exclude:
        - package.json
        - package-lock.json
  add-labels:
    allowed: [Ready to merge, Needs attention, blocked]
    create-if-missing: true
    max: 1
  remove-labels:
    allowed: [Ready to merge, Needs attention, blocked]
    max: 3
  add-comment:
    max: 1
    hide-older-comments: true
evals:
  - id: dep_bots_only
    question: If the pull request author is not renovate[bot] or dependabot[bot], does the agent output show a comment, noop, and no status label? If the author is a dependency bot, answer UNKNOWN.
  - id: one_status_label
    question: If this was a Renovate or Dependabot PR the agent finished, does the agent output apply exactly one of Ready to merge, Needs attention, or blocked? If the PR was skipped as out of scope, answer UNKNOWN.
  - id: comment_when_human
    question: If the verdict is Needs attention or blocked, does the agent output include add_comment explaining what was investigated, tried, and still unresolved? If the verdict is Ready to merge with no push, answer UNKNOWN.
  - id: no_unrelated_edits
    question: Do file changes stay limited to the dependency update and the breakage it caused (types, imports, snapshots, lockfile, call sites), with no unrelated refactors?
---

# Dependency PR Review

You are reviewing a single Open Collective frontend dependency-update pull request.

## Goal

Review the labeled PR, decide whether the update is safe and compatible, run local checks, fix reasonable breakage, and apply exactly one status label.

## Activation

This run starts when `agent-dependency-review` is applied to a pull request (the label is then removed so it can be re-applied). Required evidence:

- `/tmp/gh-aw/data/pr-number.txt`
- `/tmp/gh-aw/data/pr.json`
- `/tmp/gh-aw/data/pr-files.txt`
- `/tmp/gh-aw/data/pr-checks.json`

If `/tmp/gh-aw/data/skip-reason.txt` exists, call `noop` with that reason and stop.

Follow the `dependency-pr-review` skill.

## Task

1. Review the PR and understand what dependency is being updated and why.
2. Check whether the update is safe and compatible with the repository.
3. Run the relevant tests and checks.
4. If there are failures or issues that can reasonably be fixed, iterate on the PR: investigate, make the necessary changes, and run the checks again.
5. Continue iterating until the PR is either in a good state or there is a significant blocker that requires human intervention.
6. Do not make unrelated changes simply to get a PR passing.

When the work on a PR is complete, apply exactly one of these labels:

- **Ready to merge** — the dependency update has been reviewed, the relevant checks pass, and there are no significant concerns.
- **Needs attention** — the update has issues that require a human to investigate or make a decision, but the update itself is not fundamentally blocked.
- **blocked** — an important blocker prevents the dependency update from being completed or properly validated.

Leave useful context on the PR when human attention is required, explaining what was investigated, what was tried, and what remains unresolved.

## Guardrails

- Only Renovate and Dependabot PRs. Other PRs get a comment and `noop` (no status label).
- Do not merge. Do not edit `.github/`, renovate or Dependabot config, or unrelated features.
- At most one push via `push_to_pull_request_branch`. Do not open a second pull request.
- Do not run Cypress / e2e. Local required checks are `type:check`, `lint:quiet`, `prettier:check`, and `npm test`, plus `build` when compile is in scope.
- Use `gh` for GitHub reads. Use configured safe outputs for all writes.

## Safe Outputs

- `push_to_pull_request_branch` when this run made fixes on the triggering PR.
- `add_labels` / `remove_labels` so exactly one of `Ready to merge`, `Needs attention`, or `blocked` remains.
- `add_comment` when the verdict is `Needs attention` or `blocked`, and when `Ready to merge` after a push (note that GitHub CI including e2e will re-run).
- `noop` when there is no PR in this event or the PR is out of scope.
