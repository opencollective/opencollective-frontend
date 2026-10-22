import * as fs from 'fs';

import { fileURLToPath } from 'node:url';

import { addIgnoredEntries, readIgnoredEntries } from '../../lib/i18n/ignored-ids';
import { validateTranslation } from '../../lib/i18n/translation-validation';

import { loadEnglishMessages, loadLocaleMessages, writeLocaleMessages } from './translation-stats.js';

const TRANSLATION_STATS_PATH = fileURLToPath(new URL('./translation-stats.ts', import.meta.url));

const USAGE = [
  'Usage:',
  '  tsx scripts/i18n/apply-translations.ts <locale> <translations.json>',
  '    Validates and writes a batch of `{ "<id>": "<translation>" }`. Invalid entries are skipped and reported.',
  '  tsx scripts/i18n/apply-translations.ts <locale> --check [--base <previous-locale.json>]',
  '    Validates every translated entry, or only the entries that changed since --base.',
  '  tsx scripts/i18n/apply-translations.ts <locale> --carry-over <previous-locale.json>',
  '    Re-applies translations from an earlier version of the locale file for strings that still match English.',
].join('\n');

function normalizeLocale(arg: string): string {
  return arg.replace(/\.json$/i, '');
}

function readJsonFile(filePath: string): Record<string, string> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, string>;
}

function reportErrors(invalid: Array<{ id: string; errors: string[] }>): void {
  for (const { id, errors } of invalid) {
    console.error(`${id}: ${errors.join('; ')}`);
  }
}

/** Translations that were dropped since `base`: deleted ids, values reset to English, or unknown ids. */
function findRegressions(
  locale: string,
  en: Record<string, string>,
  messages: Record<string, string>,
  base: Record<string, string>,
): Array<{ id: string; errors: string[] }> {
  const ignored = readIgnoredEntries(fs.readFileSync(TRANSLATION_STATS_PATH, 'utf8'), locale);
  const regressions = Object.keys(base)
    .filter(id => en[id] !== undefined && base[id] !== en[id])
    .flatMap(id => {
      if (messages[id] === undefined) {
        return [{ id, errors: ['translation was deleted'] }];
      } else if (messages[id] === en[id] && ignored[id] === undefined) {
        return [{ id, errors: ['translation was reverted to English'] }];
      }
      return [];
    });
  const unknown = Object.keys(messages)
    .filter(id => en[id] === undefined && base[id] === undefined)
    .map(id => ({ id, errors: ['unknown message id'] }));
  return [...regressions, ...unknown];
}

function check(locale: string, messages: Record<string, string>, basePath?: string): void {
  const en = loadEnglishMessages();
  const base = basePath ? readJsonFile(basePath) : {};
  const invalid = [
    ...(basePath ? findRegressions(locale, en, messages, base) : []),
    ...Object.keys(messages)
      .filter(id => en[id] !== undefined && messages[id] !== en[id] && (!basePath || messages[id] !== base[id]))
      .map(id => ({ id, errors: validateTranslation(en[id], messages[id]) }))
      .filter(({ errors }) => errors.length),
  ];

  if (invalid.length) {
    reportErrors(invalid);
    console.error(`${invalid.length} invalid ${locale} translation(s)`);
    process.exit(1);
  }

  console.log(`All checked ${locale} translations are valid`);
}

function apply(locale: string, messages: Record<string, string>, translations: Record<string, string>): void {
  const en = loadEnglishMessages();
  const invalid: Array<{ id: string; errors: string[] }> = [];
  let applied = 0;

  for (const [id, translation] of Object.entries(translations)) {
    const errors = en[id] === undefined ? ['unknown message id'] : validateTranslation(en[id], translation);
    if (errors.length) {
      invalid.push({ id, errors });
    } else {
      messages[id] = translation;
      applied++;
    }
  }

  writeLocaleMessages(locale, messages);
  console.log(`Applied ${applied} ${locale} translation(s)`);
  if (invalid.length) {
    reportErrors(invalid);
    console.error(`Skipped ${invalid.length} invalid translation(s); fix them and apply again`);
    process.exit(1);
  }
}

function ignore(locale: string, entries: Record<string, string>): void {
  const knownIds = new Set(Object.keys(loadEnglishMessages()));
  const source = fs.readFileSync(TRANSLATION_STATS_PATH, 'utf8');
  const result = addIgnoredEntries(source, locale, entries, knownIds);
  fs.writeFileSync(TRANSLATION_STATS_PATH, result.source, 'utf8');
  console.log(`Ignored ${result.added.length} ${locale} message id(s)`);
  if (result.errors.length) {
    result.errors.forEach(error => console.error(error));
    console.error(`Skipped ${result.errors.length} invalid id(s)`);
    process.exit(1);
  }
}

function diffIgnored(locale: string, basePath: string, headPath: string): void {
  const base = readIgnoredEntries(fs.readFileSync(basePath, 'utf8'), locale);
  const head = readIgnoredEntries(fs.readFileSync(headPath, 'utf8'), locale);
  const added = Object.fromEntries(Object.entries(head).filter(([id]) => base[id] === undefined));
  console.log(JSON.stringify(added, null, 2));
}

function main(): void {
  const [localeArg, ...rest] = process.argv.slice(2);
  if (!localeArg || !rest.length) {
    console.error(USAGE);
    process.exit(1);
  }

  const locale = normalizeLocale(localeArg);
  const messages = loadLocaleMessages(locale);
  if (!messages) {
    console.error(`Locale file not found: lang/${locale}.json`);
    process.exit(1);
  }

  if (rest[0] === '--check') {
    const baseIndex = rest.indexOf('--base');
    check(locale, messages, baseIndex === -1 ? undefined : rest[baseIndex + 1]);
  } else if (rest[0] === '--ignore') {
    ignore(locale, readJsonFile(rest[1]));
  } else if (rest[0] === '--diff-ignored') {
    diffIgnored(locale, rest[1], rest[2]);
  } else if (rest[0] === '--carry-over') {
    const en = loadEnglishMessages();
    const previous = readJsonFile(rest[1]);
    const carriedOver = Object.fromEntries(
      Object.entries(previous).filter(
        ([id, value]) => en[id] !== undefined && messages[id] === en[id] && value !== en[id],
      ),
    );
    apply(locale, messages, carriedOver);
  } else {
    apply(locale, messages, readJsonFile(rest[0]));
  }
}

main();
