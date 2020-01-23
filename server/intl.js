// Polyfill Node with `Intl` that has data for all locales.
// See: https://formatjs.io/guides/runtime-environments/#server
const IntlPolyfill = require('intl');
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const path = require('path');

const glob = require('glob');
const accepts = require('accepts');

const logger = require('./logger');

// Get the supported languages by looking for translations in the `lang/` dir.
const languages = [
  'en', // Ensure English is always first in the list
  ...glob
    .sync(path.join(__dirname, '../lang/*.json'))
    .map(f => path.basename(f, '.json'))
    .filter(locale => locale !== 'en'),
];

// We need to load and expose the translations on the request for the user's locale
function getMessages(locale) {
  const localeFile = path.join(__dirname, `../lang/${locale}.json`);
  return require(localeFile);
}

function middleware() {
  return (req, res, next) => {
    if (req.query.language && languages.includes(req.query.language)) {
      // Detect language as query string in the URL
      req.language = req.query.language;
    } else if (req.cookies.language && languages.includes(req.cookies.language)) {
      // Detect language in Cookie
      req.language = req.cookies.language;
    }

    // No auto-detection in test environments
    if (['test', 'e2e', 'ci', 'circleci'].includes(process.env.NODE_ENV)) {
      req.locale = req.language || 'en';
    } else {
      req.locale = req.language || accepts(req).language(languages) || 'en';
    }

    logger.debug('url %s locale %s', req.url, req.locale);
    req.messages = getMessages(req.locale);
    next();
  };
}

module.exports = { middleware, getMessages, languages };
