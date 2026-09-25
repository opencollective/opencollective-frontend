// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

// imported using require
// ts-unused-exports:disable-next-line
export const getTextFromPdfContent = async (
  pdfContent: Buffer | { type: 'Buffer'; data: number[] },
): Promise<string> => {
  // cy.task serializes the Buffer from cy.readFile to `{ type: 'Buffer', data: [...] }`, which pdf-parse v2 rejects
  const data = Buffer.isBuffer(pdfContent) ? pdfContent : Buffer.from(pdfContent.data);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};
