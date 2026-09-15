---
name: dependency-pr-review
description: Reviews one Open Collective frontend Renovate or Dependabot pull request, runs local compatibility checks, applies focused fixes when needed, and applies exactly one status label (Ready to merge, Needs attention, or blocked). Use when the agent-dependency-review label is applied, or when asked to review a frontend dependency-update PR.
---

# Dependency PR review

Work from this repository root. Read prefetch files under `/tmp/gh-aw/data/` first when they exist. Do not spend the run re-listing GitHub unless a file is missing.

## Guardrails

1. Only **Renovate** (`renovate[bot]`) and **Dependabot** (`dependabot[bot]`). Any other author: comment that this workflow is for dependency-update PRs only, do **not** add a status label, call `noop`, stop.
2. Do not merge. Do not edit `.github/`, `renovate.json`, Dependabot config, agent instruction files, or unrelated features.
3. Do not make unrelated changes simply to get a PR passing.
4. One run = local iteration + **at most one** `push_to_pull_request_branch`. Safe-outputs apply after the agent finishes, so this run cannot wait for GitHub CI of its own push. Re-apply `agent-dependency-review` after CI if another pass is needed.
5. Use `gh` for GitHub reads. Use configured safe outputs for all writes (push, labels, comments). Do not `git push` or `gh pr merge`.

## Prefetch (when present)

| File                              | Contents                                                        |
| --------------------------------- | --------------------------------------------------------------- |
| `/tmp/gh-aw/data/pr-number.txt`   | Pull request number                                             |
| `/tmp/gh-aw/data/pr.json`         | Title, author, body, labels, files, head/base, draft, mergeable |
| `/tmp/gh-aw/data/pr-files.txt`    | Changed paths                                                   |
| `/tmp/gh-aw/data/pr-checks.json`  | Current GitHub check runs                                       |
| `/tmp/gh-aw/data/skip-reason.txt` | Present only when there is no PR in this event                  |

If `skip-reason.txt` exists, call `noop` with that reason and stop.

## Status labels

Apply **exactly one** of:

| Label             | When                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Ready to merge`  | The dependency update has been reviewed, the relevant local checks pass, and there are no significant concerns.                   |
| `Needs attention` | The update has issues that require a human to investigate or make a decision, but the update itself is not fundamentally blocked. |
| `blocked`         | An important blocker prevents the dependency update from being completed or properly validated.                                   |

Swap status by adding the verdict label and removing the other two. Only remove `blocked` when this run's verdict is no longer blocked.

Comment on the PR when the verdict is `Needs attention` or `blocked`: what was investigated, what was tried, and what remains unresolved. If you pushed fixes and labeled `Ready to merge`, a short comment must note that GitHub CI (including e2e) will re-run.

## Loop

Copy this checklist and track progress:

```
Task progress:
- [ ] 1. Review the PR and understand what dependency is being updated and why
- [ ] 2. Check whether the update is safe and compatible with the repository
- [ ] 3. Run the relevant tests and checks
- [ ] 4. If there are failures or issues that can reasonably be fixed, iterate
- [ ] 5. Continue until good state or a significant blocker
- [ ] 6. Apply exactly one status label (and comment when human attention is required)
```

### 1. Review

Read the PR body, labels, changed files, and usage of the package in `components/`, `lib/`, `pages/`, `server/`. Distinguish security bumps from routine updates. Titles containing `abandoned` and major version bumps need extra caution, not an automatic skip.

### 2. Compatibility

Check peer dependencies, Next/React/TypeScript constraints, and call sites. Note breaking changelog items that would require source or snapshot updates.

### 3. Local checks

`node_modules` is installed before the agent starts. If `package-lock.json` on the PR branch does not match that install, run `CYPRESS_INSTALL_BINARY=0 npm ci --prefer-offline --no-audit` first. Do **not** run Cypress / e2e (needs API, Postgres, images, PDF).

Always:

```bash
npm run type:check
npm run lint:quiet
npm run prettier:check
npm test
```

Also run `npm run build` when the package can affect compile (Next, webpack, TypeScript, Babel, or a failed typecheck that looks like a build-graph issue). Run `npm run depcheck` only if dependencies were added or removed.

Inspect `pr-checks.json` for current GitHub CI. Treat red e2e as context; do not try to reproduce e2e locally.

### 4–5. Iterate

If failures can reasonably be fixed, investigate, make the necessary changes, and run the checks again. Allowed fixes: types, imports, snapshots, lockfile / peer-dep resolution, small API call-site updates caused by the bump.

Fix with `npm run prettier:write` / `lint:fix` only for files this update requires. Conventional Commits on the push (`fix(deps): …`, `chore(deps): …`). Leave the working tree for `push_to_pull_request_branch` (include a conventional commit message). `if-no-changes: ignore` if you did not edit files.

Stop iterating when checks pass or a significant blocker remains (incompatible major, missing secret, Dependabot branch cannot be updated, protected-file refusal, or a product/design decision).

### 6. Label

- **Ready to merge** — update understood, required local checks pass, no significant concern. If GitHub CI was already green and nothing was pushed, this is the default. If you pushed fixes, apply this only when local checks passed and note that GitHub CI will re-run.
- **Needs attention** — human decision or remaining test/CI failure that looks fixable, not a hard stop.
- **blocked** — cannot complete or validate.

Then call the matching `add_labels` / `remove_labels` tools and `add_comment` when required.
