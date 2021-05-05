import * as fs from 'fs';

import { sync as globSync } from 'glob';
import { difference, has, invertBy, orderBy } from 'lodash';
import { sync as mkdirpSync } from 'mkdirp';

import locales from '../lib/constants/locales';

const MESSAGES_PATTERN = './dist/messages/**/*.json';
const LANG_DIR = './lang/';
const DEFAULT_TRANSLATIONS_FILE = `${LANG_DIR}en.json`;
const DUPLICATED_IGNORED_IDS = new Set([
  'section.team.title',
  'contribute.step.details',
  'order.status',
  'expense.status',
  'expense.markAsPaid',
  'expense.approved',
  'expense.rejected',
  'order.rejected',
]);
const DUPLICATED_IGNORED_MESSAGES = new Set(['all', 'type', 'paid', 'pending', 'other']);

/* eslint-disable no-console */

// Aggregates the default messages that were extracted from the app's
// React components via the React Intl Babel plugin. An error will be thrown if
// there are messages in different components that use the same `id`. The result
// is a flat collection of `id: message` pairs for the app's default locale.
const duplicates = [];
const defaultMessages = globSync(MESSAGES_PATTERN)
  .map(filename => fs.readFileSync(filename, 'utf8'))
  .map(file => JSON.parse(file))
  .reduce((collection, descriptors) => {
    descriptors.forEach(({ id, defaultMessage }) => {
      if (Object.prototype.hasOwnProperty.call(collection, id)) {
        if (collection[id] !== defaultMessage) {
          duplicates.push({ id, base: collection[id], other: defaultMessage });
        }
      } else {
        collection[id] = defaultMessage;
      }
    });

    return collection;
  }, {});

if (duplicates.length > 0) {
  duplicates.forEach(({ id, base, other }) => {
    console.error(`🛑 [Error] Duplicate message id with different messages for "${id}"`);
    console.error(`--- Base:  "${base}"`);
    console.error(`--- Other: "${other}"`);
  });
  throw new Error('The strings include duplicate IDs with different messages');
}

/**
 * Store new keys in translation file without overwritting the existing ones.
 */
const translatedMessages = (locale, defaultMessages, updatedKeys) => {
  const filename = `${LANG_DIR}${locale}.json`;
  const file = fs.readFileSync(filename, 'utf8');
  const json = JSON.parse(file);

  // Do translate
  const updatedMessages = Object.keys(defaultMessages)
    .map(id => [id, defaultMessages[id]])
    .reduce((collection, [id, defaultMessage]) => {
      if (updatedKeys.includes(id)) {
        // If default message was updated, override the translation
        collection[id] = defaultMessage;
      } else {
        // Otherwise we only save the default message if there's no translation yet
        collection[id] = json[id] || defaultMessage;
      }

      return collection;
    }, {});

  // Make sure that the result matches the structure of default template
  if (difference(Object.keys(updatedMessages), Object.keys(defaultMessages)).length !== 0) {
    throw new Error(`Translations for ${locale} doesn't match the base file`);
  }

  return updatedMessages;
};

/**
 * Sort translation object's keys alphabetically
 */
const sortKeys = i18nKeys => {
  return orderBy(i18nKeys, [key => key.toLowerCase()]);
};

/**
 * Get the diff between two translations objects.
 */
const getDiff = (base, newDefaults) => {
  const sortedOldKeys = sortKeys(Object.keys(base));
  const sortedNewKeys = sortKeys(Object.keys(newDefaults));
  return {
    removed: difference(sortedOldKeys, sortedNewKeys),
    created: difference(sortedNewKeys, sortedOldKeys),
    updated: sortedNewKeys.filter(key => {
      return has(base, key) && has(newDefaults, key) && base[key] !== newDefaults[key];
    }),
  };
};

/**
 * Convert to JSON and ensure that the keys are sorted properly.
 */
const convertToJSON = obj => {
  return `${JSON.stringify(obj, sortKeys(Object.keys(obj)), 2)}\n`;
};

/**
 * Update the keys for locale and save the file
 */
const translate = (locale, defaultMessages, updatedKeys) => {
  const translations = convertToJSON(translatedMessages(locale, defaultMessages, updatedKeys));
  fs.writeFileSync(`${LANG_DIR}${locale}.json`, translations);
};

const warnForDuplicateMessages = messages => {
  const groupedMessages = invertBy(messages);
  Object.entries(groupedMessages).forEach(([message, ids]) => {
    const filteredIds = ids.filter(id => !DUPLICATED_IGNORED_IDS.has(id));
    if (filteredIds.length > 1 && !DUPLICATED_IGNORED_MESSAGES.has(message.toLowerCase())) {
      console.info(`ℹ️  Found similar message for IDs (${filteredIds.join(', ')}): ${message}`);
    }
  });
};

// Look for duplicate messages
warnForDuplicateMessages(defaultMessages);

// Load existing translations, check what changed
const existingTranslationsObj = JSON.parse(fs.readFileSync(DEFAULT_TRANSLATIONS_FILE, 'utf8'));
const diff = getDiff(existingTranslationsObj, defaultMessages);

// Display changes
diff.removed.forEach(key => console.info(`🗑️   [REMOVE] "${key}"`));
diff.created.forEach(key => console.info(`🆕  [CREATE] "${key}"`));
diff.updated.forEach(key => console.info(`📥  [UPDATE] "${key}"`));

// Save translations
mkdirpSync(LANG_DIR);
const supportedLocales = Object.keys(locales).filter(locale => locale !== 'en');
supportedLocales.forEach(locale => {
  translate(locale, defaultMessages, diff.updated);
});

// Write root file at the end to only save if translations don't crash
fs.writeFileSync(DEFAULT_TRANSLATIONS_FILE, convertToJSON(defaultMessages));
console.info('✔️  Done!');
