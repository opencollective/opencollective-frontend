import * as fs from 'fs';
import * as path from 'path';

const LANG_DIR = path.resolve(__dirname, '../../lang');

/**
 * English message values that are intentionally identical in the locale (same word,
 * loanword, brand, etc.). Excludes them from the "still English" report. Match is
 * exact (full string equals English).
 */
const IGNORED: Record<string, readonly string[]> = {
  fr: [
    'qMePPG',
    'LseLoM',
    'Logo',
    'profile.incognito',
    'Type', // key id equals "Type" in en
    'Timezone.Local',
    'tier.interval.flexible',
    '+U6ozc', // "Type" - même terme en français
    '0LK5eg', // "Contribution" - identique
    '1+ROfp', // "Transaction" - identique (finance)
    'AccountingCategory.code', // "Code" - identique
    'AddFundsModal.source', // "Source" - identique
    'AdminPanel.button', // "Admin" - libellé court conservé
  ],
};

function loadJson(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Record<string, string>;
}

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

  const enPath = path.join(LANG_DIR, 'en.json');
  const localePath = path.join(LANG_DIR, `${locale}.json`);

  if (!fs.existsSync(localePath)) {
    console.error(`Locale file not found: ${localePath}`);
    process.exit(1);
  }

  const en = loadJson(enPath);
  const translated = loadJson(localePath);
  const ignoredForLocale = new Set(IGNORED[locale] ?? []);

  let printed = 0;
  for (const id of Object.keys(en)) {
    const english = en[id];
    const value = translated[id];
    if (value !== undefined && value === english && !ignoredForLocale.has(id)) {
      console.log(`${id}: ${english}`);
      printed++;
      if (limit !== undefined && printed >= limit) {
        break;
      }
    }
  }
}

main();
