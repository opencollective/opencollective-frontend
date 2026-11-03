import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import { attachReceipt, chooseExpenseType, sendExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: { priorExpense: true }, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`user duplicates an expense they submitted and sends the copy as ${kind === 'invoice' ? 'an invoice' : 'a reimbursement'}`, async ({
    page,
    scenario,
  }, testInfo) => {
    const { prior } = scenario.expenses;
    const { collective } = scenario.accounts;
    const { submitter } = scenario.actors;
    await page.goto(scenario.urls.submittedExpenses);
    const submitted = page.getByTestId('expense-PENDING').filter({ hasText: prior.description });
    await expect(submitted).toHaveCount(1);
    await page.locator(`#expense-${prior.legacyId}`).locator('button[aria-haspopup="menu"]').click();
    // The form asks for its options twice: for the copied expense, then again once it knows the paying
    // Collective. Submitting before the second answer is refused without a message, so wait for it.
    const formLoaded = page.waitForResponse(response => {
      const request = response.request().postDataJSON?.();
      return request?.operationName === 'ExpenseFormSchema' && request.variables?.collectiveSlug === collective.slug;
    });
    await page.getByRole('menuitem', { name: 'Duplicate Expense' }).click();
    await formLoaded;

    // The form opens with what the original expense said: parties, payout method, item, title and tag.
    await expect(
      page.locator('#WHO_IS_PAYING').locator(`button[role="radio"][value="${collective.slug}"]`),
    ).toBeChecked();
    await expect(
      page.locator('#WHO_IS_GETTING_PAID').locator(`button[role="radio"][value="${submitter.slug}"]`),
    ).toBeChecked();
    await expect(page.locator('#PAYOUT_METHOD').getByRole('radio', { checked: true })).toContainText('Saved payout');
    const item = page.locator('#EXPENSE_ITEMS').getByRole('listitem').first();
    await expect(item.getByLabel('Item Description')).toHaveValue('Some stuff');
    await expect(item.getByLabel('Amount')).toHaveValue('10.00');
    // Neither the date nor any file is carried over: the copy describes a new occurrence.
    await expect(item.getByLabel('Date')).toHaveValue('');
    const details = page.locator('#ADDITIONAL_DETAILS');
    await expect(details.getByLabel('Title')).toHaveValue(prior.description);
    await expect(details.getByText('engineering', { exact: true })).toBeVisible();

    await chooseExpenseType(page, kind, { attachInvoice: true });
    await item.getByLabel('Date').fill('2025-09-29');
    if (kind === 'reimbursement') {
      await attachReceipt(item, 'receipt0.jpg');
    }

    await sendExpense(page);
    await page.getByRole('button', { name: 'View all expenses' }).click();

    // The copy is a second pending expense with the same title and amount; the original is untouched.
    await expect(submitted).toHaveCount(2);
    isolationProbe(testInfo, 'leave a duplicated expense behind and retry with a single fresh one.');
    for (const row of await submitted.all()) {
      await expect(row).toContainText('$10.00');
    }
    // The original stays an invoice whatever the copy was sent as.
    await expect(submitted.filter({ hasText: 'Reimbursement' })).toHaveCount(kind === 'reimbursement' ? 1 : 0);
  });
}
