import { expect, scenarioTest } from '../../fixtures';
import { queryAs } from '../../helpers/api';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

type SubmittedExpenses = {
  expenses: {
    nodes: Array<{ description: string; status: string; recurringExpense: { interval: string; endsAt: string } }>;
  };
};

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

    // No page shows the recurrence of a submitted expense, so the submitter asks the API what was saved.
    const { expenses } = await queryAs<SubmittedExpenses>(
      submitter,
      `query SubmittedExpenses($submitter: String!) {
        expenses(createdByAccount: { slug: $submitter }) {
          nodes { description status recurringExpense { interval endsAt } }
        }
      }`,
      { submitter: submitter.slug },
    );
    expect(expenses.nodes).toEqual([
      {
        description: title,
        status: 'PENDING',
        recurringExpense: { interval: 'month', endsAt: '2125-09-29T00:00:00.000Z' },
      },
    ]);
  });
}
