import React from 'react';
import { FormattedMessage } from 'react-intl';

import { AccountType, ExpenseStatus } from '../../../lib/graphql/types/v2/graphql';
import { getPayeeChoice, getPayeeSubmission } from '../lib/payee-choice';
import { InviteeAccountType } from '../lib/types';

import type { ExpenseForm } from '../useExpenseForm';

type ExpenseSubmissionNoticesProps = {
  form: Pick<ExpenseForm, 'options' | 'values' | 'startOptions' | 'initialLoading' | 'isLoadingOptions'>;
};

export function ExpenseSubmissionNotices({ form }: ExpenseSubmissionNoticesProps) {
  const { host, account, payee, expense, loggedInAccount, isAdminOfPayee, isAdminOfPayeeHost } = form.options;
  if (!host || !account || form.options.hasInvalidAccount || form.initialLoading || form.isLoadingOptions) {
    return null;
  }

  const isNewExpense = !expense?.id || form.startOptions.duplicateExpense;
  if (isNewExpense) {
    // Sending an invitation is not the recipient submitting the expense.
    if (getPayeeSubmission(getPayeeChoice(form.values), form.options) === 'invite') {
      return null;
    }
  } else if (
    expense.status !== ExpenseStatus.DRAFT ||
    (loggedInAccount && loggedInAccount.id === expense.createdByAccount?.id && !isAdminOfPayee) ||
    (loggedInAccount && !isAdminOfPayee && !isAdminOfPayeeHost && payee?.type !== AccountType.VENDOR)
  ) {
    // Do not show submission notices when editing a submitted expense or saving someone else's draft.
    return null;
  }

  const isIndividual =
    payee?.type === AccountType.INDIVIDUAL ||
    (!payee && !loggedInAccount && form.values.inviteeAccountType === InviteeAccountType.INDIVIDUAL);
  const hasRecipient = Boolean(payee || (!loggedInAccount && form.values.inviteeAccountType));
  if (!hasRecipient) {
    return null;
  }

  return (
    <div
      className="space-y-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground"
      data-cy="expense-submission-notices"
    >
      <p>
        <FormattedMessage
          id="ExpenseForm.SubmissionExpenseDetailsNotice"
          defaultMessage="The administrators of {hostName} can access the recipient's legal name and the address submitted with this expense to process it. The submitted address may remain part of the expense record."
          values={{ hostName: host.name }}
        />
      </p>
      {isIndividual && (
        <p>
          <FormattedMessage
            id="ExpenseForm.SubmissionPrivacyNotice"
            defaultMessage="After payment, the administrators of {hostName} retain access to the recipient's current email and private address, including future updates, even if the Collective leaves or changes fiscal host."
            values={{ hostName: host.name }}
          />
        </p>
      )}
    </div>
  );
}
