---
emoji: 🇩🇪
name: i18n Translate German
description: Weekly pass over all German frontend locale strings that still match English, opened as a reviewable pull request.
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
timeout-minutes: 60
skills:
  - .agents/skills/i18n-frontend-translate
imports:
  - uses: .github/workflows/i18n/shared/i18n-translate.md
    with:
      locale: de
      language: German
evals:
  - id: translates_when_backlog
    question: If untranslated German strings were listed, does the agent output show set-translation or IGNORED updates and a create_pull_request call? If the untranslated list was empty, answer UNKNOWN.
  - id: noop_when_caught_up
    question: If the untranslated German list was empty, does the agent output show noop and no create_pull_request? If strings were listed, answer UNKNOWN.
  - id: scoped_files
    question: Does the agent output show file changes limited to lang/de.json, scripts/i18n/translation-stats.ts, and lib/constants/locales.js?
---

# i18n Translate German

See imported task instructions.
