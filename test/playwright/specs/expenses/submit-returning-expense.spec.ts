import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', {
  inputs: { secondCollective: true, payeeOrganization: true, priorExpense: true, invitee: true },
  actor: 'submitter',
});

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`returning submitter requests ${kind} payment for their Organization, then invites another payee`, async ({
    page,
    scenario,
  }, testInfo) => {
    const { submitter, invitee } = scenario.actors;
    const { collective2, organization } = scenario.accounts;
    await page.goto(scenario.urls.submittedExpenses);
    // Prior history: an expense already submitted to the first Collective.
    await expect(page.getByText(scenario.expenses.prior.description)).toBeVisible();

    const organizationTitle = `${kind} for ${organization.slug}`;
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: collective2,
      payee: {
        profile: organization,
        payoutMethod: { name: `Payout ${organization.slug}`, currency: 'USD', details: 'A second payout', save: true },
      },
      title: organizationTitle,
    });
    await expect(page.getByText(organizationTitle)).toBeVisible();
    isolationProbe(testInfo, 'leave a submitted expense behind and retry with fresh prerequisites.');

    const invitationTitle = `${kind} invitation from ${submitter.slug}`;
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, { kind, account: collective2, payee: { invitee }, title: invitationTitle });
  });
}
