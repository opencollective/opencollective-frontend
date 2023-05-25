const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // eslint-disable-line node/no-unpublished-require

export const readPdf = (pathToPdf: string): Promise<string> => {
  const resolvedPath = path.resolve(pathToPdf);
  const dataBuffer = fs.readFileSync(resolvedPath);
  return pdf(dataBuffer).then(({ text }) => text);
};
