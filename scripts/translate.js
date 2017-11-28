import * as fs from 'fs';
import {sync as globSync} from 'glob';
import {sync as mkdirpSync} from 'mkdirp';

const MESSAGES_PATTERN = './build/messages/**/*.json';
const LANG_DIR         = './src/lang/';

// Aggregates the default messages that were extracted from the example app's
// React components via the React Intl Babel plugin. An error will be thrown if
// there are messages in different components that use the same `id`. The result
// is a flat collection of `id: message` pairs for the app's default locale.
let defaultMessages = globSync(MESSAGES_PATTERN)
    .map((filename) => fs.readFileSync(filename, 'utf8'))
    .map((file) => JSON.parse(file))
    .reduce((collection, descriptors) => {
        descriptors.forEach(({id, defaultMessage}) => {
            if (collection.hasOwnProperty(id)) {
                console.error(`Duplicate message id: ${id}`);
                return;
            }

            collection[id] = defaultMessage;
        });

        return collection;
    }, {});

// For the purpose of this example app a fake locale: `en-UPPER` is created and
// the app's default messages are "translated" into this new "locale" by simply
// UPPERCASING all of the message text. In a real app this would be through some
// offline process to get the app's messages translated by machine or
// processional translators.
const translatedMessages = (locale) => {
    const file = fs.readFileSync(`${LANG_DIR}${locale}.json`, 'utf8');
    const json = JSON.parse(file);
    return Object.keys(defaultMessages)
    .map((id) => [id, defaultMessages[id]])
    .reduce((collection, [id, defaultMessage]) => {
        collection[id] = json[id] || defaultMessage;
        return collection;
    }, {});
}

mkdirpSync(LANG_DIR);
fs.writeFileSync(LANG_DIR + 'en.json', JSON.stringify(defaultMessages, null, 2));
fs.writeFileSync(LANG_DIR + 'fr.json', JSON.stringify(translatedMessages('fr'), null, 2));
fs.writeFileSync(LANG_DIR + 'es.json', JSON.stringify(translatedMessages('es'), null, 2));
fs.writeFileSync(LANG_DIR + 'ja.json', JSON.stringify(translatedMessages('ja'), null, 2));
