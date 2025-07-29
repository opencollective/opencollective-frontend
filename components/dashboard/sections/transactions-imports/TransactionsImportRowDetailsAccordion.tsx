import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { TransactionsImport } from '@/lib/graphql/types/v2/graphql';

import { i18nWithColon } from '@/components/I18nFormatters';

import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';

import { ImportedTransactionDataList } from './ImportedTransactionDataList';

export const TransactionsImportRowDetails = ({
  transactionsImportRow,
  className,
}: {
  transactionsImportRow: React.ComponentProps<typeof ImportedTransactionDataList>['row'] & {
    transactionsImport: Pick<TransactionsImport, 'id' | 'source'>;
  };
  className?: string;
}) => {
  return (
    <div className={className}>
      <div className="mb-2 text-base font-medium text-slate-700">
        {i18nWithColon(
          <FormattedMessage
            defaultMessage="Based on a {amount} {type, select, DEBIT {debit} other {credit}} from {date}"
            id="basedOnImportRow"
            values={{
              amount: (
                <FormattedMoneyAmount
                  amount={Math.abs(transactionsImportRow.amount.valueInCents)}
                  currency={transactionsImportRow.amount.currency}
                />
              ),
              type: transactionsImportRow.amount.valueInCents < 0 ? 'DEBIT' : 'CREDIT',
              date: <DateTime value={transactionsImportRow.date} />,
            }}
          />,
        )}
      </div>
      <div className="text-sm">
        <ImportedTransactionDataList
          row={transactionsImportRow}
          transactionsImport={transactionsImportRow.transactionsImport}
          collapsible
        />
      </div>
    </div>
  );
};
