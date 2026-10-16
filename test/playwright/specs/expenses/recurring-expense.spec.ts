import { expect, scenarioTest } from '../../fixtures';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`user submits ${kind === 'invoice' ? 'an invoice' : 'a reimbursement'} set to recur every month`, async ({
    page,
    scenario,
  }) => {
    const { submitter } = scenario.actors;
    const title = `Recurring ${kind} from ${submitter.slug}`;
    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: scenario.accounts.collective,
      payee: {
        profile: submitter,
        payoutMethod: { name: `Payout ${submitter.slug}`, currency: 'USD', details: 'A new payout method', save: true },
      },
      title,
      recurring: true,
    });
    await expect(page.getByText(title)).toBeVisible();
  });
}
