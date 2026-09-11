---
name: i18n-frontend-translate
description: Batches translation of locale JSON using show-untranslated and set-translation scripts, with codebase lookup for message IDs when context is unclear. Use when the user asks to translate frontend strings, reduce untranslated entries for a locale, or apply translation rules to lang files.
---

# i18n Frontend Translate

## When to Use

- User gives a **locale** (e.g. `fr`, `pt-BR`) and optionally **instructions**.
- Goal is to replace locale strings that still equal English with proper translations, using the repo scripts.

## Preconditions

- Work from this repository root.
- `lang/<locale>.json` must exist. English source of truth is `lang/en.json`.

## Workflow (loop)

1. **User inputs**: `locale` + free-text **instructions** (follow them for register, formality, product terms, and consistency).

2. **List work**: Run show-untranslated with a small batch so the task stays reviewable:

   ```bash
   npx tsx scripts/i18n/show-untranslated.ts <locale> --limit 30
   ```

   Increase `--limit` or re-run without `--limit` when draining the backlog.

3. **Per string**:
   - Read the line: `{id}: {english}`.
   - If meaning, audience, or UI role is unclear, **find context** before translating (see below).
   - If the string **should stay English** in this locale (same word in both languages, standard loanword, product name, etc.), **do not** run `set-translation`. Add the **message id** to `IGNORED['<locale>']` in `scripts/i18n/translation-stats.ts` so it stops appearing in the report. Keep a short inline comment per entry (e.g. why it is not translated). Ignore matching is by **id**, not by English value.
   - Otherwise produce the target-language string that matches instructions and preserves placeholders/markup, then apply:

   ```bash
   npx tsx scripts/i18n/set-translation.ts <locale> <id> "Translation text"
   ```

   Quote the translation so the shell does not split words.

4. **Repeat** step 2 until show-untranslated returns nothing (or the user stops).

5. **Sanity check**: Optionally re-run show-untranslated for that locale; remaining lines should be actual translation work, or items intentionally listed under `IGNORED`.

6. **Update progress**: After finishing (or when the user stops), refresh locale completion percentages in `lib/constants/locales.js`:

   ```bash
   npm run langs:update-progress
   ```

## Intentionally identical strings (`IGNORED`)

`show-untranslated` reports ids whose locale value still equals English, minus `IGNORED` for that locale. When a value is correctly left as English, register the **message id** under `IGNORED` in `scripts/i18n/translation-stats.ts`. Otherwise the loop never clears.

## Finding context for a message `id`

Use when the English line alone is ambiguous (button vs heading, legal vs casual, technical sense).

- Search the repo for the **id** (appears in `FormattedMessage`, `defineMessages`, `intl.formatMessage`, etc.):

  ```bash
  rg -l '<id>' --glob '*.{tsx,ts,js,jsx}'
  ```

  Example: `rg -l 'Ri4REE' --glob '*.{tsx,ts,js,jsx}'`

- Open the matching file(s) and read surrounding UI: labels, modals, routes, audience.

- For duplicate or generic English, context disambiguates (e.g. "Order" as noun vs verb).

- Compare with other languages or `en.json` by searching `lang/`.

## Preservation rules

- Keep **ICU placeholders** and **rich-text tags** exactly as in English unless the target language requires a different order: `{name}`, `{count}`, `{amount}`, `<Link>...</Link>`, `<Account></Account>`, etc.
- Do not invent new placeholders or remove required tags.
- Prefer **consistent product terminology** with the rest of `lang/<locale>.json` when the same concept appears elsewhere.

## Scripts reference

| Script / npm script                 | Role                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `scripts/i18n/show-untranslated.ts` | Lists `{id}: english` where locale value still equals English, minus per-locale `IGNORED` message ids. Optional `--limit N`. |
| `scripts/i18n/set-translation.ts`   | Writes one key: `set-translation.ts <locale> <id> "text"`                                                                    |
| `npm run langs:update-progress`     | Recomputes per-locale completion % and writes `lib/constants/locales.js`. Run once when done.                                |

Show-untranslated and set-translation are invoked with `npx tsx` from the repository root.
