import * as fs from 'fs';

import { validateTranslation } from '../../lib/i18n/translation-validation';

import { loadEnglishMessages, loadLocaleMessages, writeLocaleMessages } from './translation-stats.js';

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

function check(locale: string, messages: Record<string, string>, basePath?: string): void {
  const en = loadEnglishMessages();
  const base = basePath ? readJsonFile(basePath) : {};
  const invalid = Object.keys(messages)
    .filter(id => en[id] !== undefined && messages[id] !== en[id] && (!basePath || messages[id] !== base[id]))
    .map(id => ({ id, errors: validateTranslation(en[id], messages[id]) }))
    .filter(({ errors }) => errors.length);

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
