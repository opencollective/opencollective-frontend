import '../env';

import * as fs from 'fs';
import * as path from 'path';

import logger from '../server/logger';

const IGNORED_FILES = ['README.md', 'dist', 'en.json', 'ach-UG.json'];

const PROJECT_ID = 344903;
const TOKEN = process.env.CROWDIN_TOKEN;

if (!TOKEN) {
  throw new Error('Missing CROWDIN_TOKEN from env');
}

async function fetchProgress() {
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

async function main() {
  const progress = await fetchProgress();
  const simplifyLocale = (locale: string) => locale.split('-')[0];
  const crowdinLocales = new Set(
    progress.flatMap((locale: any) => [locale.data.languageId, simplifyLocale(locale.data.languageId)]),
  );

  const files = fs.readdirSync(path.join(__dirname, '../lang'));
  const unusedFiles = files.filter(file => {
    if (IGNORED_FILES.includes(file)) {
      return false;
    }

    const fileLocale = file.replace('.json', '');
    return !crowdinLocales.has(fileLocale) && !crowdinLocales.has(simplifyLocale(fileLocale));
  });

  // Remove unused files
  unusedFiles.forEach(file => {
    logger.info(`Removing ${file}`);
    fs.unlinkSync(path.join(__dirname, '../lang', file));
  });
}

main();
