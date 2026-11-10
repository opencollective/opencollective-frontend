import { expect, scenarioTest } from '../../fixtures';

const test = scenarioTest('expense-management', {
  inputs: {
    expense: {
      description: 'Expense with a PDF attachment',
      items: [{ description: 'Some stuff', amount: 1000 }],
      attachedPdf: { name: 'preview.pdf', text: 'Open Collective PDF preview' },
    },
  },
  actor: 'admin',
});

test('Collective admin previews the PDF attached to an expense', async ({ page, scenario }) => {
  await page.goto(scenario.expenses.pending.url);
  await page.getByTestId('download-expense-invoice-btn').filter({ hasText: 'preview.pdf' }).click();
  // The page and its text layer only render when the pdf.js worker loads and matches the library version;
  // otherwise the viewer shows its error message instead.
  const pdfPage = page.locator('.react-pdf__Page');
  await expect(pdfPage.locator('canvas')).toBeVisible();
  await expect(pdfPage.locator('.react-pdf__Page__textContent')).toContainText('Open Collective PDF preview');
  await expect(page.getByText('Failed to load PDF file.')).toHaveCount(0);
});
