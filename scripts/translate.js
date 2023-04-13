import * as fs from 'fs';

import { difference, has, invertBy, mapValues, orderBy } from 'lodash';
import { sync as mkdirpSync } from 'mkdirp';

import locales from '../lib/constants/locales';

const MESSAGES_FILE = './dist/messages/messages.json';
const LANG_DIR = './lang/';
const DEFAULT_TRANSLATIONS_FILE = `${LANG_DIR}en.json`;

// Use lowercase values
const DUPLICATED_IGNORED_MESSAGES = new Set([
  'admin', // Can have different masculine/feminine for some languages based on the context (role or action button)
  'all', // Can have different masculine/feminine for some languages based on the context
  'approved', // Can have different masculine/feminine for some languages based on the context
  'completed', // Can have different masculine/feminine for some languages based on the context
  'confirm', // Can have different masculine/feminine for some languages based on the context
  'expired', // Can have different masculine/feminine for some languages based on the context
  'mark as paid', // Can have different masculine/feminine for some languages based on the context (order or expense)
  'order', // Depends on whether we're talking about ordering (sorting) or an order (contribution)
  'other', // Can have different masculine/feminine for some languages based on the context
  'paid', // Can have different masculine/feminine for some languages based on the context
  'pending', // Can have different masculine/feminine for some languages based on the context
  'refunded', // Can have different masculine/feminine for some languages based on the context
  'rejected', // Can have different masculine/feminine for some languages based on the context
  'status', // Can have different masculine/feminine for some languages based on the context
  'type', // Can have different masculine/feminine for some languages based on the context
  'unknown', // Can have different translations if it is "unknown user" or "unknown type"
]);

// Aggregates the default messages that were extracted from the app's
// React components via the React Intl Babel plugin. An error will be thrown if
// there are messages in different components that use the same `id`. The result
// is a flat collection of `id: message` pairs for the app's default locale.
const messagesFile = fs.readFileSync(MESSAGES_FILE, 'utf8');
const jsonMessages = JSON.parse(messagesFile);
const defaultMessages = mapValues(jsonMessages, message => message.defaultMessage);

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

const getDuplicateMessages = messages => {
  const groupedMessages = invertBy(messages);
  const duplicates = [];
  Object.entries(groupedMessages).forEach(([message, ids]) => {
    if (ids.length > 1 && !DUPLICATED_IGNORED_MESSAGES.has(message.toLowerCase())) {
      duplicates.push({ ids: ids, message });
    }
  });

  return duplicates;
};

// Look for duplicate messages
const duplicates = getDuplicateMessages(defaultMessages);
if (duplicates.length > 0) {
  const warningsList = duplicates.map(({ ids, message }) => `(${ids.join(', ')}): ${message}`);
  const whatToDo = `
To fix this, you can either:
- Look for the original string and update the "id" or "defaultMessage"
- Or add the string to "DUPLICATED_IGNORED_MESSAGES" in "scripts/translate.js" (if the translation depends on the context)
  `;

  throw new Error(`Found duplicate messages with different IDs:\n${warningsList.join('\n')}\n${whatToDo}`);
}

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
