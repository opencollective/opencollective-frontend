import { expect, scenarioTest } from '../../fixtures';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`new user submits a first ${kind} to a Collective they do not administer`, async ({ page, scenario }) => {
    const { submitter } = scenario.actors;
    const title = `First ${kind} ${submitter.slug}`;
    await page.goto(scenario.urls.submittedExpenses);
    await expect(page.getByText('Submitted Expenses')).toBeVisible();
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: scenario.accounts.collective,
      payee: {
        profile: submitter,
        payoutMethod: { name: `Payout ${submitter.slug}`, currency: 'USD', details: 'A new payout method', save: true },
      },
      title,
    });
    await expect(page.getByText(title)).toBeVisible();
  });
}
