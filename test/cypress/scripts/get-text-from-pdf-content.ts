const pdf = require('pdf-parse'); // eslint-disable-line node/no-unpublished-require

// ignore unused exports getTextFromPdfContent
// imported using require

export const getTextFromPdfContent = (pdfContent: string): Promise<string> => {
  return pdf(pdfContent).then(({ text }) => text);
};
