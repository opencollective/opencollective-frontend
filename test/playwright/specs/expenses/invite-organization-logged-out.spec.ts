import { expect, scenarioTest } from '../../fixtures';
import {
  addPayoutMethod,
  chooseExpenseType,
  continueInvitation,
  openInvitation,
  signInFromInvitation,
  submitExpense,
} from '../../helpers/expense-form';
import { emailedSignInLink, expenseInvitationLink } from '../../helpers/mail';

const test = scenarioTest('expense-submission', { inputs: { inviteeOrganization: true }, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`logged-out admin of an invited Organization signs in from its emailed ${kind} invitation and submits the expense`, async ({
    page,
    scenario,
    mail,
    openBrowserAs,
  }) => {
    const { inviteeAdmin } = scenario.actors;
    const { collective, inviteeOrganization } = scenario.accounts;
    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: collective,
      payee: { invitee: inviteeOrganization },
      title: `${kind} invitation for ${inviteeOrganization.slug}`,
    });

    const invitation = await expenseInvitationLink(mail, { to: inviteeAdmin.email, account: collective });
    // The invitation is readable without a session; completing it for an Organization requires one.
    const visitor = await openBrowserAs(null);
    await openInvitation(visitor, invitation);
    const signIn = `/signin?next=${encodeURIComponent(invitation)}`;
    // The link only learns where to come back to once the form has settled.
    await expect(signInFromInvitation(visitor)).toHaveAttribute('href', signIn);
    await signInFromInvitation(visitor).click();
    await expect(visitor).toHaveURL(signIn);

    // The admin asks to sign in with their address. The product emails them a link back to the invitation;
    // outside production it also sends test addresses straight there, so the browser does not wait for the mail.
    await visitor.getByTestId('signIn-form').getByLabel('Your email address').fill(inviteeAdmin.email);
    await visitor.getByTestId('signin-btn').click();
    await expect(visitor).toHaveURL(invitation);
    const emailedLink = new URL(await emailedSignInLink(mail, { to: inviteeAdmin.email }), 'http://site');
    expect(emailedLink.searchParams.get('next')).toBe(invitation);

    // Back on the invitation, now signed in, the admin completes it for the Organization.
    await continueInvitation(visitor);
    await addPayoutMethod(visitor, {
      name: `Payout ${inviteeOrganization.slug}`,
      currency: 'USD',
      details: 'New payout method',
      save: true,
    });
    await chooseExpenseType(visitor, kind, { attachInvoice: true });
    await visitor.locator('form').getByRole('button', { name: 'Submit Expense' }).click();
    await expect(visitor.getByText('has been submitted successfully!')).toBeVisible();

    // The inviter finds their draft turned into the Organization's submitted expense.
    await page.goto(invitation.split('?')[0]);
    await expect(page.getByTestId('expense-status-msg')).toHaveText('Pending');
    await expect(page.getByTestId('expense-summary-payee')).toContainText(inviteeOrganization.name);
  });
}
