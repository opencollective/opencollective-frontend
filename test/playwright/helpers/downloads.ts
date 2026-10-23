import { readFileSync } from 'fs';

import type { Locator, TestInfo } from '@playwright/test';
import { PDFParse } from 'pdf-parse';

/**
 * Clicks a control that makes the browser download a PDF and returns what was
 * downloaded: the name the product suggested and the document's text. The file
 * is kept under this attempt's own output directory, so parallel journeys and
 * retries never read each other's downloads and failures keep it as evidence.
 */
export async function downloadPdf(trigger: Locator, testInfo: TestInfo): Promise<{ filename: string; text: string }> {
  const [download] = await Promise.all([trigger.page().waitForEvent('download'), trigger.click()]);
  const filename = download.suggestedFilename();
  const path = testInfo.outputPath('downloads', filename);
  await download.saveAs(path);
  const parser = new PDFParse({ data: readFileSync(path) });
  try {
    return { filename, text: (await parser.getText()).text };
  } finally {
    await parser.destroy();
  }
}
