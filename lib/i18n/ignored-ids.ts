/**
 * Text-level helpers for the `IGNORED` lists in `translation-stats.ts`. They read and write entries
 * without evaluating the file, so the i18n workflow can carry ignored ids as data and only trusted
 * code turns them back into source. Entries look like `    '<id>', // <reason>`.
 */

const ENTRY_PATTERN = /^ {4}'([^']+)',(?: \/\/ ?(.*))?$/;
// Quotes and backslashes would break out of the string literal, line terminators out of the comment.
// eslint-disable-next-line no-control-regex
const UNSAFE_ID_PATTERN = /['\\\u0000-\u001F\u007F\u2028\u2029]/;
// eslint-disable-next-line no-control-regex
const LINE_BREAKS_PATTERN = /[\u0000-\u001F\u007F\u2028\u2029]+/g;
const MAX_REASON_LENGTH = 160;

function findLocaleBlock(lines: string[], locale: string): { start: number; end: number } {
  const key = /^[a-z]+$/i.test(locale) ? locale : `'${locale}'`;
  const start = lines.indexOf(`  ${key}: [`);
  const end = start === -1 ? -1 : lines.findIndex((line, index) => index > start && line === '  ],');
  if (end === -1) {
    throw new Error(`IGNORED list not found for locale ${locale}`);
  }

  return { start, end };
}

/** Returns the `{ id: reason }` entries listed under `IGNORED[locale]`. */
export function readIgnoredEntries(source: string, locale: string): Record<string, string> {
  const lines = source.split('\n');
  const { start, end } = findLocaleBlock(lines, locale);
  const entries: Record<string, string> = {};
  for (const line of lines.slice(start + 1, end)) {
    const match = line.match(ENTRY_PATTERN);
    if (match) {
      entries[match[1]] = match[2] ?? '';
    }
  }

  return entries;
}

/** Appends entries to `IGNORED[locale]`, skipping ids that are already listed. */
export function addIgnoredEntries(
  source: string,
  locale: string,
  entries: Record<string, string>,
  knownIds: ReadonlySet<string>,
): { source: string; added: string[]; errors: string[] } {
  const lines = source.split('\n');
  const { end } = findLocaleBlock(lines, locale);
  const existing = readIgnoredEntries(source, locale);
  const added: string[] = [];
  const errors: string[] = [];
  const newLines: string[] = [];

  for (const [id, reason] of Object.entries(entries)) {
    if (!knownIds.has(id)) {
      errors.push(`${id}: unknown message id`);
    } else if (UNSAFE_ID_PATTERN.test(id)) {
      errors.push(`${id}: unsupported characters in message id`);
    } else if (existing[id] === undefined && !added.includes(id)) {
      const comment = String(reason ?? '')
        .replace(LINE_BREAKS_PATTERN, ' ')
        .trim()
        .slice(0, MAX_REASON_LENGTH);
      newLines.push(comment ? `    '${id}', // ${comment}` : `    '${id}',`);
      added.push(id);
    }
  }

  lines.splice(end, 0, ...newLines);
  return { source: lines.join('\n'), added, errors };
}
