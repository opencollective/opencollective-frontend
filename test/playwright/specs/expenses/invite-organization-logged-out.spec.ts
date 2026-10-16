import { expect, scenarioTest } from '../../fixtures';
import { openInvitation, signInFromInvitation, submitExpense } from '../../helpers/expense-form';
import { expenseInvitationLink } from '../../helpers/mail';

const test = scenarioTest('expense-submission', { inputs: { inviteeOrganization: true }, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`logged-out visitor opening an Organization's emailed ${kind} invitation is sent to sign in and back`, async ({
    page,
    scenario,
    mail,
    openBrowserAs,
  }) => {
    const { collective, inviteeOrganization } = scenario.accounts;
    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: collective,
      payee: { invitee: inviteeOrganization },
      title: `${kind} invitation for ${inviteeOrganization.slug}`,
    });

    const invitation = await expenseInvitationLink(mail, {
      to: scenario.actors.inviteeAdmin.email,
      account: collective,
    });
    // The invitation is readable without a session; completing it for an Organization requires one.
    const visitor = await openBrowserAs(null);
    await openInvitation(visitor, invitation);
    const signIn = `/signin?next=${encodeURIComponent(invitation)}`;
    // The link only learns where to come back to once the form has settled.
    await expect(signInFromInvitation(visitor)).toHaveAttribute('href', signIn);
    await signInFromInvitation(visitor).click();
    await expect(visitor).toHaveURL(signIn);
  });
}
