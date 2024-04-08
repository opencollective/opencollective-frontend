import React from 'react';
import { get, isEmpty } from 'lodash';
import { AlertOctagon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import FormattedMoneyAmount from '../FormattedMoneyAmount';

import { ExpenseForm } from './useExpenseForm';

type ExpenseWarningsProps = {
  form: ExpenseForm;
};

export function ExpenseWarnings(props: ExpenseWarningsProps) {
  if (!props.form.options.account) {
    return null;
  }
  const warnings: { id: string; content: React.ReactNode }[] = [];

  const collectiveBalance = props.form.options.account.stats.balance.valueInCents;
  const totalInvoiced = props.form.options.totalInvoicedInExpenseCurrency;

  if (totalInvoiced && totalInvoiced > collectiveBalance) {
    warnings.push({
      id: 'insuficient_balance',
      content: (
        <FormattedMessage
          defaultMessage="The Collective's budget ({amount}) is insufficient to pay this expense." id="gt8gMS"
          values={{
            amount: (
              <FormattedMoneyAmount
                abbreviate
                currencyCodeStyles={{ fontWeight: 'bold' }}
                amount={props.form.options.account.stats.balance.valueInCents}
                currency={props.form.options.account.stats.balance.currency}
              />
            ),
          }}
        />
      ),
    });
  }

  const invitePayee = props.form.values.invitePayee;
  if (
    invitePayee &&
    !('legacyId' in invitePayee) &&
    invitePayee.payoutMethod &&
    isEmpty(get(props.form.errors, 'invitePayee.payoutMethod'))
  ) {
    const accountHolderName = invitePayee.payoutMethod.data?.accountHolderName;
    const invitePayeeName = invitePayee.organization ? invitePayee.organization?.name : invitePayee?.name;
    if (accountHolderName && invitePayeeName && accountHolderName !== invitePayeeName) {
      warnings.push({
        id: 'mismatched_invited_account_holder',
        content: (
          <FormattedMessage
            defaultMessage="The account holder name ({accountHolderName}) of the payout method does not match the invited name ({invitePayeeName})." id="3jC7kl"
            values={{
              accountHolderName,
              invitePayeeName,
            }}
          />
        ),
      });
    }

    const payoutMethodEmail = invitePayee.payoutMethod.data?.email || invitePayee?.payoutMethod?.data?.details?.email;
    const invitePayeeEmail = invitePayee?.email;
    if (payoutMethodEmail && invitePayeeEmail !== payoutMethodEmail) {
      warnings.push({
        id: 'mismatched_invited_account_email',
        content: (
          <FormattedMessage
            defaultMessage="The email ({payoutMethodEmail}) associated with the payout method does not match the invited email ({invitePayeeEmail})." id="cnQDle"
            values={{
              payoutMethodEmail,
              invitePayeeEmail,
            }}
          />
        ),
      });
    }
  }

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center p-2" style={{ backgroundColor: '#FFFC89' }}>
      <div className="flex items-center gap-4 text-xs">
        <div>
          <AlertOctagon />
        </div>
        <div>
          <div className="font-bold">
            <FormattedMessage defaultMessage="Expense alert" id="UJoCJd" />:
          </div>
          <div className="flex flex-col gap-2">
            {warnings.map(warning => {
              return <div key={warning.id}>{warning.content}</div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
