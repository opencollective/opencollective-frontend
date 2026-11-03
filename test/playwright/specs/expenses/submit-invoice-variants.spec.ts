import { expect, scenarioTest } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

test('user without administered accounts creates a legal entity and submits an invoice through it', async ({
  page,
  scenario,
}) => {
  // The handle of the Organization the journey creates: nobody else has it, on a fresh or a populated stack.
  const slug = `pw-entity-${attemptTag(scenario.attempt)}`;
  const title = `Invoice from ${slug}`;
  await page.goto(scenario.urls.submittedExpenses);
  await page.getByRole('button', { name: 'New expense' }).click();
  await submitExpense(page, {
    kind: 'invoice',
    account: scenario.accounts.collective,
    payee: {
      legalEntity: { legalName: `${slug} Legal Inc.`, name: `${slug} Organization`, slug },
      payoutMethod: { name: `Payout ${slug}`, currency: 'USD', details: 'A new payout method', save: true },
    },
    title,
  });
  await expect(page.getByText(title)).toBeVisible();
});

test.describe('paying Collective subject to VAT', () => {
  test.use({ inputs: { collective: { country: 'BE', vat: { type: 'OWN', number: 'FRXX999999999' } } } });

  test('user submits an invoice with value-added tax', async ({ page, scenario }) => {
    const { submitter } = scenario.actors;
    const title = `Invoice with VAT ${submitter.slug}`;
    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind: 'invoice',
      account: scenario.accounts.collective,
      payee: {
        profile: submitter,
        payoutMethod: { name: `Payout ${submitter.slug}`, currency: 'USD', details: 'A new payout method', save: true },
      },
      title,
      vat: true,
    });
    await expect(page.getByText(title)).toBeVisible();
  });
});
