import '../env';

import * as fs from 'fs';
import * as path from 'path';

import { cloneDeep } from 'lodash';
import fetch from 'node-fetch';

import locales from '../lib/constants/locales.js';

const PROJECT_ID = 344903;
const TOKEN = process.env.CROWDIN_TOKEN;

// Some locales have a different code in Crowdin than in the locales.js file
const LOCALE_ALIASES = {
  'es-ES': 'es',
  'pt-PT': 'pt',
  sk: 'sk-SK',
  'zh-CN': 'zh',
};

if (!TOKEN) {
  throw new Error('Missing CROWDIN_TOKEN from env');
}

export async function fetchProgress() {
  try {
    const { data } = await fetch(`https://api.crowdin.com/api/v2/projects/${PROJECT_ID}/languages/progress`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` },
    }).then(res => res.json());

    return data;
  } catch (err) {
    return { status: 'err', message: err.message };
  }
}

const generateLocalesForJsFile = locales => {
  return `export default ${JSON.stringify(locales)};`;
};

export async function main() {
  const progress = await fetchProgress();
  const newLocales = cloneDeep(locales);
  for (const progressItem of progress) {
    const localeProgress = progressItem.data;
    const localeFileCode = LOCALE_ALIASES[localeProgress.languageId] || localeProgress.languageId;
    const locale = newLocales[localeFileCode];

    if (locale) {
      locale.completion = `${localeProgress.translationProgress}%`;
    } else if (localeProgress.translationProgress > 30) {
      console.log(
        `[Info] Locale ${localeProgress.languageId} has ${localeProgress.translationProgress}% translation progress, consider adding it to the locales.js file.`,
      );
    }
  }

  // Generate content
  const filePath = path.join(__dirname, '../lib/constants/locales.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const contentStart = fileContent.indexOf('export default');
  const newContent = fileContent.slice(0, contentStart) + generateLocalesForJsFile(newLocales);

  // Write file
  fs.writeFileSync(filePath, newContent);
}

main(process.argv[2], process.argv[3]);
