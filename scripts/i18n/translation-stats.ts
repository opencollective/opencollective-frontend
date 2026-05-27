import * as fs from 'fs';
import * as path from 'path';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

type UntranslatedEntry = {
  id: string;
  english: string;
};

type TranslationStats = {
  total: number;
  translated: number;
  untranslated: number;
  completionPercent: number;
};

function isUntranslated(id: string, english: string, value: string | undefined, ignoredIds: Set<string>): boolean {
  return value !== undefined && value === english && !ignoredIds.has(id);
}

export function getUntranslatedEntries(
  en: Record<string, string>,
  translated: Record<string, string>,
  locale: string,
): UntranslatedEntry[] {
  const ignoredForLocale = new Set(IGNORED[locale] ?? []);
  const entries: UntranslatedEntry[] = [];

  for (const id of Object.keys(en)) {
    const english = en[id];
    const value = translated[id];
    if (isUntranslated(id, english, value, ignoredForLocale)) {
      entries.push({ id, english });
    }
  }

  return entries;
}

function getTranslationStats(
  en: Record<string, string>,
  translated: Record<string, string>,
  locale: string,
): TranslationStats {
  const total = Object.keys(en).length;
  const untranslated = getUntranslatedEntries(en, translated, locale).length;
  const translatedCount = total - untranslated;
  const completionPercent = total === 0 ? 100 : Math.round((translatedCount / total) * 100);

  return {
    total,
    translated: translatedCount,
    untranslated,
    completionPercent,
  };
}

export function loadEnglishMessages(): Record<string, string> {
  return loadJson(path.join(LANG_DIR, 'en.json'));
}

export function loadLocaleMessages(locale: string): Record<string, string> | null {
  const localePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(localePath)) {
    return null;
  }

  return loadJson(localePath);
}

export function getLocaleTranslationStats(locale: string): TranslationStats | null {
  if (locale === 'en') {
    return { total: 0, translated: 0, untranslated: 0, completionPercent: 100 };
  }

  const en = loadEnglishMessages();
  const translated = loadLocaleMessages(locale);
  if (!translated) {
    return null;
  }

  return getTranslationStats(en, translated, locale);
}
