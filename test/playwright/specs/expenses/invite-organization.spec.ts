import { expect, scenarioTest } from '../../fixtures';
import { addPayoutMethod, chooseExpenseType, openInvitation, submitExpense } from '../../helpers/expense-form';
import { expenseInvitationLink } from '../../helpers/mail';

const test = scenarioTest('expense-submission', { inputs: { inviteeOrganization: true }, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`invited Organization follows its emailed ${kind} invitation and submits the expense`, async ({
    page,
    scenario,
    mail,
    openBrowserAs,
  }, testInfo) => {
    const { inviteeAdmin } = scenario.actors;
    const { collective, inviteeOrganization } = scenario.accounts;
    const title = `${kind} invitation for ${inviteeOrganization.slug}`;

    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, { kind, account: collective, payee: { invitee: inviteeOrganization }, title });

    // The Organization's admin receives the invitation and follows its link.
    const invitation = await expenseInvitationLink(mail, {
      to: inviteeAdmin.email,
      account: collective,
    });
    if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
      throw new Error('Intentional isolation probe: leave a delivered, unanswered invitation behind and retry.');
    }
    const invited = await openBrowserAs('inviteeAdmin');
    await openInvitation(invited, invitation);
    await addPayoutMethod(invited, {
      name: `Payout ${inviteeOrganization.slug}`,
      currency: 'USD',
      details: 'New payout method',
      save: true,
    });
    await chooseExpenseType(invited, kind, { attachInvoice: true });
    await invited.locator('form').getByRole('button', { name: 'Submit Expense' }).click();
    await expect(invited.getByText('has been submitted successfully!')).toBeVisible();

    // The inviter finds their draft turned into the payee's submitted expense.
    await page.goto(invitation.split('?')[0]);
    await expect(page.getByTestId('expense-status-msg')).toHaveText('Pending');
    await expect(page.getByTestId('expense-summary-payee')).toContainText(inviteeOrganization.name);
  });
}
