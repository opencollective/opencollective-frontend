import { expect, scenarioTest } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';
import {
  addPayoutMethod,
  chooseExpenseType,
  openInvitation,
  sendExpense,
  signInFromInvitation,
  submitExpense,
} from '../../helpers/expense-form';
import { expenseInvitationLink } from '../../helpers/mail';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

for (const kind of ['invoice', 'reimbursement'] as const) {
  test(`person without an account follows their emailed ${kind} invitation and submits the expense without signing in`, async ({
    page,
    scenario,
    mail,
    openBrowserAs,
  }) => {
    const { collective } = scenario.accounts;
    // Nobody holds this address: the invitation is the first the platform hears of this person.
    const newPayee = { name: `New payee ${attemptTag(scenario.attempt)}`, email: mail.address('new-payee') };

    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, {
      kind,
      account: collective,
      payee: { invitee: newPayee },
      title: `${kind} invitation for ${newPayee.name}`,
    });

    const invitation = await expenseInvitationLink(mail, { to: newPayee.email, account: collective });
    const invited = await openBrowserAs(null);
    await openInvitation(invited, invitation);
    const gettingPaid = invited.locator('#WHO_IS_GETTING_PAID');
    // The inviter's details identify the payee; an account is only created on submission.
    await expect(gettingPaid.getByLabel('Contact name')).toHaveValue(newPayee.name);
    await expect(gettingPaid.getByLabel('Email address')).toHaveValue(newPayee.email);
    await expect(signInFromInvitation(invited)).toBeVisible();

    await addPayoutMethod(invited, {
      name: `Payout ${newPayee.name}`,
      currency: 'USD',
      details: 'New payout method',
      save: false,
    });
    await chooseExpenseType(invited, kind, { attachInvoice: false });
    await sendExpense(invited);

    // The inviter finds their draft turned into the payee's submitted expense.
    await page.goto(invitation.split('?')[0]);
    await expect(page.getByTestId('expense-status-msg')).toHaveText('Pending');
    await expect(page.getByTestId('expense-summary-payee')).toContainText(newPayee.name);
  });
}
