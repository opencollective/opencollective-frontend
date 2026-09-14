---
emoji: 🇪🇸
name: i18n Translate Spanish
description: Weekly pass over all Spanish frontend locale strings that still match English, opened as a reviewable pull request.
intent: Reduce remaining Spanish frontend locale strings that still match English so Spanish-speaking users see translated UI copy.
engine: copilot
model: gpt-5.6-luna
on:
  schedule: weekly on sunday
  workflow_dispatch:
  skip-if-match: 'is:pr is:open "gh-aw-workflow-id: i18n-translate-es" in:body'
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: none
timeout-minutes: 60
skills:
  - .agents/skills/i18n-frontend-translate
imports:
  - uses: .github/workflows/i18n/shared/i18n-translate.md
    with:
      locale: es
      language: Spanish
evals:
  - id: translates_when_backlog
    question: If untranslated Spanish strings were listed, does the agent output show set-translation or IGNORED updates and a create_pull_request call? If the untranslated list was empty, answer UNKNOWN.
  - id: noop_when_caught_up
    question: If the untranslated Spanish list was empty, does the agent output show noop and no create_pull_request? If strings were listed, answer UNKNOWN.
  - id: scoped_files
    question: Does the agent output show file changes limited to lang/es.json, scripts/i18n/translation-stats.ts, and lib/constants/locales.js?
---

# i18n Translate Spanish

See imported task instructions.
