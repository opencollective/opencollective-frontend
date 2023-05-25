const fs = require('fs-extra'); // eslint-disable-line node/no-unpublished-require
const path = require('path');

export const listFiles = (downloadsFolder): string[] => {
  try {
    const files = fs.readdirSync(downloadsFolder);
    return files.map(file => path.join(downloadsFolder, file));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Could not read ${downloadsFolder} folder: ${e}`);
    return [];
  }
};
