import { validateTranslation } from '../../lib/i18n/translation-validation';

import { loadEnglishMessages, loadLocaleMessages, writeLocaleMessages } from './translation-stats.js';

function normalizeLocale(arg: string): string {
  return arg.replace(/\.json$/i, '');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: tsx scripts/i18n/set-translation.ts <locale> <id> <translation...>');
    console.error('Example: tsx scripts/i18n/set-translation.ts fr +1HAHt "URL du profil"');
    process.exit(1);
  }

  const locale = normalizeLocale(args[0]);
  const id = args[1];
  const translation = args.slice(2).join(' ');

  const data = loadLocaleMessages(locale);
  if (!data) {
    console.error(`Locale file not found: lang/${locale}.json`);
    process.exit(1);
  }

  const english = loadEnglishMessages()[id];
  if (english === undefined) {
    console.error(`Unknown message id: ${id}`);
    process.exit(1);
  }

  const errors = validateTranslation(english, translation);
  if (errors.length) {
    console.error(`Invalid translation for ${id}: ${errors.join('; ')}`);
    process.exit(1);
  }

  data[id] = translation;
  writeLocaleMessages(locale, data);
}

main();
