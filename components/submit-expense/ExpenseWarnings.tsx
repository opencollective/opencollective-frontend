import React from 'react';
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

  const collectiveBalance = props.form.options.account.stats.balance.valueInCents;
  const totalInvoiced = props.form.options.totalInvoicedInExpenseCurrency;

  if (!totalInvoiced || totalInvoiced < collectiveBalance) {
    return null;
  }

  return (
    <div className="flex justify-center p-2" style={{ backgroundColor: '#FFFC89' }}>
      <div className="flex items-center gap-4  text-xs">
        <div>
          <AlertOctagon />
        </div>
        <div>
          <div className="font-bold">
            <FormattedMessage defaultMessage="Expense alert" />:
          </div>
          <div>
            <FormattedMessage
              defaultMessage="The Collective's budget ({amount}) is insufficient to pay this expense."
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
          </div>
        </div>
      </div>
    </div>
  );
}
