// Polyfill Node with `Intl` that has data for all locales.
// See: https://formatjs.io/guides/runtime-environments/#server
import IntlPolyfill from 'intl';
Intl.NumberFormat = IntlPolyfill.NumberFormat
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat

import {readFileSync} from 'fs';
import path from 'path';
import glob from 'glob';

// Get the supported languages by looking for translations in the `lang/` dir.
export const languages = glob.sync(path.join(__dirname, '../lang/*.json')).map((f) => path.basename(f, '.json'))
console.log("> loading languages", languages);

// We need to expose React Intl's locale data on the request for the user's
// locale. This function will also cache the scripts by lang in memory.
const localeDataCache = new Map()

export function getLocaleDataScript(locale = 'en') {
  const lang = locale.split('-')[0];
  if (!localeDataCache.has(lang)) {
    const localeDataFile = require.resolve(`react-intl/locale-data/${lang}`)
    const localeDataScript = readFileSync(localeDataFile, 'utf8')
    localeDataCache.set(lang, localeDataScript)
  }
  return localeDataCache.get(lang)
}

// We need to load and expose the translations on the request for the user's
// locale. These will only be used in production, in dev the `defaultMessage` in
// each message description in the source code will be used.
export function getMessages(locale) {
  const localeFile = path.join(__dirname, `../lang/${locale}.json`);
  return require(localeFile);
}
