// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

// imported using require
// ts-unused-exports:disable-next-line
export const getTextFromPdfContent = async (pdfContent: string): Promise<string> => {
  const parser = new PDFParse({ data: pdfContent });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
};
