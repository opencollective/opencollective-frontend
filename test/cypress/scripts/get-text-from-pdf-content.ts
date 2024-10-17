const pdf = require('pdf-parse'); // eslint-disable-line n/no-unpublished-require, @typescript-eslint/no-var-requires

// imported using require
// ts-unused-exports:disable-next-line
export const getTextFromPdfContent = (pdfContent: string): Promise<string> => {
  return pdf(pdfContent).then(({ text }) => text);
};
