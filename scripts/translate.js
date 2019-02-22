import * as fs from 'fs';
import { sync as globSync } from 'glob';
import { sync as mkdirpSync } from 'mkdirp';

const MESSAGES_PATTERN = './dist/messages/**/*.json';
const LANG_DIR = './src/lang/';

// Aggregates the default messages that were extracted from the app's
// React components via the React Intl Babel plugin. An error will be thrown if
// there are messages in different components that use the same `id`. The result
// is a flat collection of `id: message` pairs for the app's default locale.
const defaultMessages = globSync(MESSAGES_PATTERN)
  .map(filename => fs.readFileSync(filename, 'utf8'))
  .map(file => JSON.parse(file))
  .reduce((collection, descriptors) => {
    descriptors.forEach(({ id, defaultMessage }) => {
      if (collection.hasOwnProperty(id)) {
        if (collection[id] !== defaultMessage) {
          console.error(`[Error] Duplicate message id with different messages: ${id}`);
        }
        return;
      }
      collection[id] = defaultMessage;
    });

    return collection;
  }, {});

/**
 * Store new keys in translation file without overwritting the existing ones.
 */
const translatedMessages = locale => {
  const filename = `${LANG_DIR}${locale}.json`;
  const file = fs.readFileSync(filename, 'utf8');
  const json = JSON.parse(file);

  // Check if there are unused keys in the translation file
  Object.keys(json).map(id => {
    if (!defaultMessages.hasOwnProperty(id)) {
      console.info(`Removing unused ${id} from ${filename}`);
    }
  });

  // Do translate
  return Object.keys(defaultMessages)
    .map(id => [id, defaultMessages[id]])
    .reduce((collection, [id, defaultMessage]) => {
      collection[id] = json[id] || defaultMessage;
      return collection;
    }, {});
};

mkdirpSync(LANG_DIR);
fs.writeFileSync(`${LANG_DIR}en.json`, JSON.stringify(defaultMessages, null, 2));
fs.writeFileSync(`${LANG_DIR}fr.json`, JSON.stringify(translatedMessages('fr'), null, 2));
fs.writeFileSync(`${LANG_DIR}es.json`, JSON.stringify(translatedMessages('es'), null, 2));
fs.writeFileSync(`${LANG_DIR}ja.json`, JSON.stringify(translatedMessages('ja'), null, 2));
