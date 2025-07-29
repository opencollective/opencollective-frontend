import { groupBy } from 'lodash';

import { type TransactionsImportRow, TransactionsImportRowStatus } from '@/lib/graphql/types/v2/schema';

export const getPossibleActionsForSelectedRows = (
  selectedRows: Pick<TransactionsImportRow, 'id' | 'status'>[],
): {
  canIgnore: Array<TransactionsImportRow['id']>;
  canRestore: Array<TransactionsImportRow['id']>;
  canPutOnHold: Array<TransactionsImportRow['id']>;
} => {
  const selectedStatuses = groupBy(selectedRows, 'status');
  const pendingRowIds = selectedStatuses[TransactionsImportRowStatus.PENDING]?.map(row => row.id) || [];
  const onHoldRowIds = selectedStatuses[TransactionsImportRowStatus.ON_HOLD]?.map(row => row.id) || [];
  const ignoredRowIds = selectedStatuses[TransactionsImportRowStatus.IGNORED]?.map(row => row.id) || [];
  return {
    canIgnore: [...pendingRowIds, ...onHoldRowIds],
    canRestore: [...ignoredRowIds, ...onHoldRowIds],
    canPutOnHold: pendingRowIds,
  };
};
