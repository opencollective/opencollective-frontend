import * as fs from 'fs';
import * as path from 'path';

import { cloneDeep } from 'lodash-es';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import locales from '../../lib/constants/locales.js';

import { getLocaleTranslationStats } from './translation-stats.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const generateLocalesForJsFile = locales => {
  return `export default ${JSON.stringify(locales)};`;
};

function main() {
  const newLocales = cloneDeep(locales);

  for (const localeCode of Object.keys(newLocales)) {
    const stats = getLocaleTranslationStats(localeCode);

    if (!stats) {
      console.warn(`[Warn] Locale file not found for ${localeCode}, keeping existing completion.`);
      continue;
    }

    newLocales[localeCode].completion = `${stats.completionPercent}%`;
  }

  const filePath = path.join(__dirname, '../../lib/constants/locales.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const contentStart = fileContent.indexOf('export default');
  const newContent = fileContent.slice(0, contentStart) + generateLocalesForJsFile(newLocales);

  fs.writeFileSync(filePath, newContent);
}

main();
