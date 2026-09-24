import { getUntranslatedEntries, loadEnglishMessages, loadLocaleMessages } from './translation-stats.js';

function normalizeLocale(arg: string): string {
  return arg.replace(/\.json$/i, '');
}

type ParsedArgs = { locale: string; limit: number | undefined };

function parseArgs(argv: string[]): ParsedArgs {
  let limit: number | undefined;
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') {
      const next = argv[++i];
      if (next === undefined) {
        console.error('Error: --limit requires a number.');
        process.exit(1);
      }
      const n = Number.parseInt(next, 10);
      if (!Number.isFinite(n) || n < 0) {
        console.error('Error: --limit must be a non-negative integer.');
        process.exit(1);
      }
      limit = n;
    } else if (a.startsWith('--limit=')) {
      const n = Number.parseInt(a.slice('--limit='.length), 10);
      if (!Number.isFinite(n) || n < 0) {
        console.error('Error: --limit must be a non-negative integer.');
        process.exit(1);
      }
      limit = n;
    } else {
      positionals.push(a);
    }
  }

  const locale = positionals[0];
  if (!locale) {
    console.error('Usage: tsx scripts/i18n/show-untranslated.ts <locale> [--limit <n>]');
    console.error('Example: tsx scripts/i18n/show-untranslated.ts fr --limit 50');
    process.exit(1);
  }

  return { locale, limit };
}

function main(): void {
  const { locale: localeArg, limit } = parseArgs(process.argv.slice(2));

  const locale = normalizeLocale(localeArg);
  if (locale === 'en') {
    console.error('Refusing to compare en with en (pick another locale).');
    process.exit(1);
  }

  const en = loadEnglishMessages();
  const translated = loadLocaleMessages(locale);
  if (!translated) {
    console.error(`Locale file not found: lang/${locale}.json`);
    process.exit(1);
  }

  const entries = getUntranslatedEntries(en, translated, locale);
  const toPrint = limit === undefined ? entries : entries.slice(0, limit);

  for (const { id, english } of toPrint) {
    console.log(`${id}: ${english}`);
  }
}

main();
