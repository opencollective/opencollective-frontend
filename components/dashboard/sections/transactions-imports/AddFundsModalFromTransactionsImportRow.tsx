import React from 'react';
import { useApolloClient } from '@apollo/client';
import { isEmpty, startCase } from 'lodash';

import type {
  TransactionsImport,
  TransactionsImportRow,
  TransactionsImportStats,
} from '../../../../lib/graphql/types/v2/schema';

import type { BaseModalProps } from '../../../ModalContext';
import AddFundsModal from '../collectives/AddFundsModal';

const prettyPrintRawValues = (rawValue: Record<string, string>) => {
  return Object.entries(rawValue)
    .filter(([, value]) => !isEmpty(value))
    .map(([key, value]) => `- ${startCase(key)}: ${JSON.stringify(value)}`)
    .join('\n');
};

export const AddFundsModalFromImportRow = ({
  collective,
  host,
  transactionsImport,
  row,
  open,
  setOpen,
}: {
  collective?: React.ComponentProps<typeof AddFundsModal>['collective'];
  transactionsImport: Pick<TransactionsImport, 'source' | 'name'>;
  host: React.ComponentProps<typeof AddFundsModal>['host'];
  row: TransactionsImportRow;
} & BaseModalProps) => {
  const client = useApolloClient();
  if (!open) {
    return null;
  }

  return (
    <AddFundsModal
      onClose={() => setOpen(false)}
      host={host}
      transactionsImportRow={row}
      collective={collective}
      initialValues={{
        amount: row.amount.valueInCents,
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
              return {
                ...stats,
                imported: stats.imported + 1,
                processed: stats.processed + 1,
                orders: stats.orders + 1,
              };
            },
          },
        });
      }}
    />
  );
};
