// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

// imported using require
// ts-unused-exports:disable-next-line
export const getTextFromPdfContent = (pdfContent: string): Promise<string> => {
  return pdf(pdfContent).then(({ text }) => text);
};
