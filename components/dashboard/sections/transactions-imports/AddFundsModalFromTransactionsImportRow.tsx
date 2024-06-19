import React from 'react';
import { useApolloClient } from '@apollo/client';
import { isEmpty, startCase } from 'lodash';

import type {
  TransactionsImport,
  TransactionsImportRow,
  TransactionsImportStats,
} from '../../../../lib/graphql/types/v2/graphql';

import AddFundsModal from '../collectives/AddFundsModal';

const prettyPrintRawValues = (rawValue: Record<string, string>) => {
  return Object.entries(rawValue)
    .filter(([, value]) => !isEmpty(value))
    .map(([key, value]) => `- ${startCase(key)}: ${value}`)
    .join('\n');
};

export const AddFundsModalFromImportRow = ({
  transactionsImport,
  row,
  onClose,
}: {
  transactionsImport: TransactionsImport;
  row: TransactionsImportRow;
  onClose: () => void;
}) => {
  const client = useApolloClient();
  return (
    <AddFundsModal
      onClose={onClose}
      host={transactionsImport.account}
      initialValues={{
        amount: row.amount.valueInCents,
        currency: row.amount.currency,
        description: row.description,
        processedAt: row.date.split('T')[0],
        memo: `Imported from "${transactionsImport.source} - ${transactionsImport.name}". Row values:\n${prettyPrintRawValues(row.rawValue)}`,
        transactionsImportRow: { id: row.id },
      }}
      onSuccess={order => {
        // Update row
        client.cache.modify({
          id: client.cache.identify(row),
          fields: { order: () => order },
        });

        // Update transactions import stats
        client.cache.modify({
          id: client.cache.identify(transactionsImport),
          fields: {
            stats: (stats: TransactionsImportStats): TransactionsImportStats => {
              return { ...stats, processed: stats.processed + 1, orders: stats.orders + 1 };
            },
          },
        });
      }}
    />
  );
};
