# i18n Translate ${LANGUAGE}

Reduce the remaining ${LANGUAGE} (`${LOCALE}`) frontend locale strings that still match English, so ${LANGUAGE}-speaking users see translated UI copy. Follow the `.agents/skills/i18n-frontend-translate/SKILL.md` skill, with the overrides below.

## Evidence (read first)

All files are in `${DATA_DIR}`:

- `untranslated.txt`: every remaining `{id}: {english}` line, already capped at ${MAX_STRINGS} lines for this run. `untranslated-total.txt` has the full backlog size.
- `invalid.txt`: existing `${LOCALE}` translations that break placeholders, tags, or contain invisible characters. Fix them too.
- `recent-i18n-prs.json`: recently merged i18n pull requests for this locale, including human corrections. Read the diffs of the most relevant ones with `gh pr diff <number>` and follow their terminology.
- `previous-pr.diff` (only when an earlier run's pull request is still open): its translations and `IGNORED` additions were already carried over. Review them and fix any that are wrong.

## Task

1. Translate or ignore **every** id in `untranslated.txt`, and fix every id in `invalid.txt`.
2. Match product terminology already used in `lang/${LOCALE}.json` and in recent human i18n fixes. Use Contribution rather than Order, and keep the register (formal/informal) used by the rest of the file. When a string is ambiguous, look up its id in the code (`rg -l '<id>' components lib pages`).
3. Write translations as a JSON object `{ "<id>": "<translation>" }` to `${DATA_DIR}/translations.json`, in batches of about 50 entries, and apply each batch with:

   ```bash
   npx tsx scripts/i18n/apply-translations.ts ${LOCALE} ${DATA_DIR}/translations.json
   ```

   The script rejects entries with changed `{placeholders}`, changed `<tags>`, invalid ICU syntax, or invisible characters such as zero-width spaces or soft hyphens. Fix every reported entry and re-apply until it exits cleanly.

4. For strings that should stay English (identical word, loanword, brand, format-only string), write `{ "<id>": "<short reason>" }` to `${DATA_DIR}/ignored.json` and add them to `IGNORED['${LOCALE}']` with:

   ```bash
   npx tsx scripts/i18n/apply-translations.ts ${LOCALE} --ignore ${DATA_DIR}/ignored.json
   ```

   Do not translate those ids. Reasons follow the existing entries, e.g. `"Avatar" - loanword identical`.

5. Run `npx tsx scripts/i18n/show-untranslated.ts ${LOCALE}` to confirm that every id from `untranslated.txt` is gone, then `npm run langs:update-progress` once.

Change files only through these scripts. A later workflow step keeps only the `lang/${LOCALE}.json` translations and the `IGNORED['${LOCALE}']` additions, validates them, and opens the pull request: do not commit, push, or open one yourself.

## Result

Return the structured output:

- `pr_title`: short summary of what was translated, without a prefix (the workflow adds `[i18n-${LOCALE}] `). Empty when nothing changed.
- `pr_body`: Markdown with the number of strings received, translated vs IGNORED counts, notable IGNORED ids and why, fixed invalid translations, and how many untranslated ids remain. Empty when nothing changed.
- `slack_summary`: one or two plain-text sentences with the same counts, or why nothing changed.
