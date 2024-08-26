// This script counts the number of styled-components imports in the project and compares it to the number of imports before TailwindCSS was introduced.

import * as fs from 'fs';
import * as path from 'path';

const SEARCH_DIR = path.resolve(__dirname, '..');
const ORIGINAL_IMPORT_COUNT = 343;

function countStyledComponentsImports(searchDir: string): number {
  let count = 0;

  function searchDirectory(directory: string) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (error) {
        continue; // skip entries that cannot be accessed
      }

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file[0] !== '.') {
          // skip node_modules and hidden directories
          searchDirectory(fullPath);
        }
      } else if (
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.jsx') ||
        fullPath.endsWith('.ts') ||
        fullPath.endsWith('.tsx')
      ) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (line.match(/import .* from 'styled-components'/) || line.match(/require\('styled-components'\)/)) {
            count++;
          }
        }
      }
    }
  }

  searchDirectory(searchDir);
  return count;
}

function calculateProgress(currentCount: number, originalCount: number): number {
  return 100 - (currentCount / originalCount) * 100;
}

const currentCount = countStyledComponentsImports(SEARCH_DIR);
const progress = calculateProgress(currentCount, ORIGINAL_IMPORT_COUNT);

console.log(`Current number of styled-components imports: ${currentCount}`); // eslint-disable-line no-console
console.log(`Original number of styled-components imports: ${ORIGINAL_IMPORT_COUNT}`); // eslint-disable-line no-console
console.log(`Migration Progress: ${progress.toFixed(2)}%`); // eslint-disable-line no-console
