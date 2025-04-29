import React from 'react';
import { useMutation } from '@apollo/client';
import { cloneDeep, pick, uniq, update } from 'lodash';
import { ArchiveRestore, Banknote, Merge, PauseCircle, Receipt, SquareSlashIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../../lib/actions/types';
import { i18nGraphqlException } from '../../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import type { Account, TransactionsImport, TransactionsImportRow } from '../../../../../lib/graphql/types/v2/schema';
import { TransactionsImportRowStatus } from '../../../../../lib/graphql/types/v2/schema';
import { getAccountReferenceInput } from '@/lib/collective';
import type { UpdateTransactionsImportRowMutation } from '@/lib/graphql/types/v2/graphql';

import { useModal } from '../../../../ModalContext';
import StyledSpinner from '../../../../StyledSpinner';
import { useToast } from '../../../../ui/useToast';
import { HostCreateExpenseModal } from '../../expenses/HostCreateExpenseModal';
import { AddFundsModalFromImportRow } from '../AddFundsModalFromTransactionsImportRow';
import { MatchContributionDialog } from '../MatchContributionDialog';
import { MatchExpenseDialog } from '../MatchExpenseDialog';

import { updateTransactionsImportRows } from './graphql';

/**
 * @deprecated
 */
const deprecatedGetOptimisticResponse = (
  transactionsImport,
  rowIds,
  status: TransactionsImportRowStatus,
): UpdateTransactionsImportRowMutation => {
  type ReturnedTransactionsImport = UpdateTransactionsImportRowMutation['updateTransactionsImportRows']['import'];
  const optimisticResult = {
    import: cloneDeep(pick<ReturnedTransactionsImport, 'id' | 'stats'>(transactionsImport, ['id', 'stats'])),
    rows: [],
  };

  // Update nodes
  update(optimisticResult, 'rows', nodes =>
    nodes.map(node => (!rowIds.includes(node.id) ? node : { ...node, status })),
  );

  // Update stats
  if (status === TransactionsImportRowStatus.IGNORED) {
    update(optimisticResult, 'import.stats.ignored', ignored => ignored + rowIds.length);
    update(optimisticResult, 'import.stats.processed', processed => processed + rowIds.length);
  } else if (status === TransactionsImportRowStatus.PENDING) {
    update(optimisticResult, 'import.stats.ignored', ignored => ignored - rowIds.length);
    update(optimisticResult, 'import.stats.processed', processed => processed - rowIds.length);
  }

  return { updateTransactionsImportRows: optimisticResult };
};

/**
 * @deprecated use `useOffPlatformTransactionsActions` instead
 */
export function useTransactionsImportActions({
  host,
  transactionsImport,
  assignments,
}: {
  host: React.ComponentProps<typeof MatchContributionDialog>['host'] &
    React.ComponentProps<typeof MatchExpenseDialog>['host'];
  transactionsImport: Pick<TransactionsImport, 'id'> &
    React.ComponentProps<typeof AddFundsModalFromImportRow>['transactionsImport'] &
    React.ComponentProps<typeof MatchContributionDialog>['transactionsImport'] &
    React.ComponentProps<typeof MatchExpenseDialog>['transactionsImport'];
  assignments: Record<string, Pick<Account, 'id' | 'slug' | 'type'>[]>;
}): {
  getActions: GetActions<TransactionsImportRow>;
  setRowsStatus: (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    options?: { includeAllPages?: boolean },
  ) => Promise<void>;
} {
  const { toast } = useToast();
  const intl = useIntl();
  const [updatingRows, setUpdatingRows] = React.useState<Array<string>>([]);
  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const { showModal, hideModal } = useModal();

  const setRowsStatus = async (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    { includeAllPages = false } = {},
  ) => {
    setUpdatingRows(uniq([...updatingRows, ...rowIds]));
    try {
      let action: string;
      if (includeAllPages) {
        if (newStatus === TransactionsImportRowStatus.IGNORED) {
          action = 'DISMISS_ALL';
        } else if (newStatus === TransactionsImportRowStatus.PENDING) {
          action = 'RESTORE_ALL';
        } else if (newStatus === TransactionsImportRowStatus.ON_HOLD) {
          action = 'PUT_ON_HOLD_ALL';
        } else {
          action = 'UPDATE_ROWS';
        }
      } else {
        action = 'UPDATE_ROWS';
      }

      await updateRows({
        variables: {
          importId: transactionsImport.id,
          action,
          ...(!includeAllPages && {
            rows: rowIds.map(id => ({ id, status: newStatus })),
          }),
        },
        optimisticResponse: deprecatedGetOptimisticResponse(transactionsImport, rowIds, newStatus),
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    } finally {
      setUpdatingRows(updatingRows.filter(rowId => !rowIds.includes(rowId)));
    }
  };

  const getActions: GetActions<TransactionsImportRow> = (
    row: TransactionsImportRow,
    onCloseFocusRef: React.MutableRefObject<HTMLElement>,
  ) => {
    const actions: ReturnType<GetActions<TransactionsImportRow>> = { primary: [], secondary: [] };
    const isImported = Boolean(row.expense || row.order);
    const isUpdatingRow = updatingRows.includes(row.id);
    const assignedAccounts = assignments[row.accountId];
    const showAddFundsModal = () => {
      showModal(
        AddFundsModalFromImportRow,
        { collective: assignedAccounts, transactionsImport, row, onCloseFocusRef },
        'add-funds-modal',
      );
    };

    if (isImported) {
      return actions;
    } else if (row.status !== TransactionsImportRowStatus.IGNORED) {
      if (row.amount.valueInCents > 0) {
        actions.primary.push({
          key: 'match',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match contribution" id="c7INEq" />,
          disabled: isUpdatingRow,
          onClick: () =>
            showModal(
              MatchContributionDialog,
              {
                accounts: assignedAccounts,
                transactionsImport,
                row,
                host,
                onCloseFocusRef,
                onAddFundsClick: () => {
                  hideModal('match-contribution-modal');
                  showAddFundsModal();
                },
              },
              'match-contribution-modal',
            ),
        });
        actions.primary.push({
          key: 'add-funds',
          Icon: Banknote,
          label: <FormattedMessage defaultMessage="Add funds" id="sx0aSl" />,
          disabled: isUpdatingRow,
          onClick: showAddFundsModal,
        });
      } else if (row.amount.valueInCents < 0) {
        actions.primary.push({
          key: 'match-expense',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match expense" id="BGB+3j" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              MatchExpenseDialog,
              { host, row, transactionsImport, onCloseFocusRef, accounts: assignedAccounts },
              'host-match-expense-modal',
            );
          },
        });
        actions.primary.push({
          key: 'create-expense',
          Icon: Receipt,
          label: <FormattedMessage defaultMessage="Add expense" id="6/UjBO" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              HostCreateExpenseModal,
              { host, onCloseFocusRef, transactionsImport, transactionsImportRow: row, account: assignedAccounts },
              'host-create-expense-modal',
            );
          },
        });
      }
    }

    if (row.status !== TransactionsImportRowStatus.IGNORED && row.status !== TransactionsImportRowStatus.ON_HOLD) {
      actions.primary.push({
        key: 'on-hold',
        Icon: PauseCircle,
        onClick: () => setRowsStatus([row.id], TransactionsImportRowStatus.ON_HOLD),
        disabled: isUpdatingRow,
        label: (
          <div>
            <FormattedMessage defaultMessage="Put on Hold" id="+pCc8I" />
            {isUpdatingRow && <StyledSpinner size={14} ml={2} />}
          </div>
        ),
      });
    }

    actions.primary.push({
      key: 'ignore',
      Icon: row.status === TransactionsImportRowStatus.IGNORED ? ArchiveRestore : SquareSlashIcon,
      onClick: () =>
        setRowsStatus(
          [row.id],
          row.status === TransactionsImportRowStatus.IGNORED
            ? TransactionsImportRowStatus.PENDING
            : TransactionsImportRowStatus.IGNORED,
        ),
      disabled: isUpdatingRow,
      label: (
        <div>
          {row.status === TransactionsImportRowStatus.IGNORED ? (
            <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
          ) : (
            <FormattedMessage defaultMessage="No action" id="zue9QR" />
          )}
          {isUpdatingRow && <StyledSpinner size={14} ml={2} />}
        </div>
      ),
    });

    return actions;
  };

  return { getActions, setRowsStatus };
}

const getOptimisticResponse = (
  host,
  rowIds,
  status: TransactionsImportRowStatus,
): UpdateTransactionsImportRowMutation => {
  type ReturnedHost = UpdateTransactionsImportRowMutation['updateTransactionsImportRows']['host'];
  const optimisticResult = {
    rows: [],
    host: cloneDeep(
      pick<ReturnedHost, 'id' | 'offPlatformTransactionsStats'>(host, ['id', 'offPlatformTransactionsStats']),
    ),
  };

  // Update nodes
  update(optimisticResult, 'rows', nodes =>
    nodes.map(node => (!rowIds.includes(node.id) ? node : { ...node, status })),
  );

  // Update stats
  if (status === TransactionsImportRowStatus.IGNORED) {
    update(optimisticResult, 'host.offPlatformTransactionsStats.ignored', ignored => ignored + rowIds.length);
    update(optimisticResult, 'host.offPlatformTransactionsStats.processed', processed => processed + rowIds.length);
  } else if (status === TransactionsImportRowStatus.PENDING) {
    update(optimisticResult, 'host.offPlatformTransactionsStats.ignored', ignored => ignored - rowIds.length);
    update(optimisticResult, 'host.offPlatformTransactionsStats.processed', processed => processed - rowIds.length);
  }

  return { updateTransactionsImportRows: optimisticResult };
};

export const useOffPlatformTransactionsActions = ({
  host,
}: {
  host: React.ComponentProps<typeof MatchContributionDialog>['host'] &
    React.ComponentProps<typeof MatchExpenseDialog>['host'];
}): {
  getActions: GetActions<TransactionsImportRow>;
  setRowsStatus: (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    options?: { includeAllPages?: boolean },
  ) => Promise<void>;
} => {
  const { toast } = useToast();
  const intl = useIntl();
  const [updatingRows, setUpdatingRows] = React.useState<Array<string>>([]);
  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const { showModal, hideModal } = useModal();

  const setRowsStatus = async (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    { includeAllPages = false } = {},
  ) => {
    setUpdatingRows(uniq([...updatingRows, ...rowIds]));
    try {
      let action: string;
      if (includeAllPages) {
        if (newStatus === TransactionsImportRowStatus.IGNORED) {
          action = 'DISMISS_ALL';
        } else if (newStatus === TransactionsImportRowStatus.PENDING) {
          action = 'RESTORE_ALL';
        } else if (newStatus === TransactionsImportRowStatus.ON_HOLD) {
          action = 'PUT_ON_HOLD_ALL';
        } else {
          action = 'UPDATE_ROWS';
        }
      } else {
        action = 'UPDATE_ROWS';
      }

      await updateRows({
        variables: {
          host: getAccountReferenceInput(host),
          action,
          ...(!includeAllPages && {
            rows: rowIds.map(id => ({ id, status: newStatus })),
          }),
        },
        optimisticResponse: getOptimisticResponse(host, rowIds, newStatus), // TODO: Not working yet
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    } finally {
      setUpdatingRows(updatingRows.filter(rowId => !rowIds.includes(rowId)));
    }
  };

  const getActions: GetActions<TransactionsImportRow> = (
    row: TransactionsImportRow,
    onCloseFocusRef: React.MutableRefObject<HTMLElement>,
  ) => {
    const actions: ReturnType<GetActions<TransactionsImportRow>> = { primary: [], secondary: [] };
    const isImported = Boolean(row.expense || row.order);
    const isUpdatingRow = updatingRows.includes(row.id);
    const assignedAccounts = row.assignedAccounts;
    const transactionsImport = row.transactionsImport;
    const showAddFundsModal = () => {
      showModal(
        AddFundsModalFromImportRow,
        { collective: assignedAccounts, transactionsImport, row, onCloseFocusRef },
        'add-funds-modal',
      );
    };

    if (isImported) {
      return actions;
    } else if (row.status !== TransactionsImportRowStatus.IGNORED) {
      if (row.amount.valueInCents > 0) {
        actions.primary.push({
          key: 'match',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match contribution" id="c7INEq" />,
          disabled: isUpdatingRow,
          onClick: () =>
            showModal(
              MatchContributionDialog,
              {
                accounts: assignedAccounts,
                transactionsImport,
                row,
                host,
                onCloseFocusRef,
                onAddFundsClick: () => {
                  hideModal('match-contribution-modal');
                  showAddFundsModal();
                },
              },
              'match-contribution-modal',
            ),
        });
        actions.primary.push({
          key: 'add-funds',
          Icon: Banknote,
          label: <FormattedMessage defaultMessage="Add funds" id="sx0aSl" />,
          disabled: isUpdatingRow,
          onClick: showAddFundsModal,
        });
      } else if (row.amount.valueInCents < 0) {
        actions.primary.push({
          key: 'match-expense',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match expense" id="BGB+3j" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              MatchExpenseDialog,
              { host, row, transactionsImport, onCloseFocusRef, accounts: assignedAccounts },
              'host-match-expense-modal',
            );
          },
        });
        actions.primary.push({
          key: 'create-expense',
          Icon: Receipt,
          label: <FormattedMessage defaultMessage="Add expense" id="6/UjBO" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              HostCreateExpenseModal,
              { host, onCloseFocusRef, transactionsImport, transactionsImportRow: row, account: assignedAccounts },
              'host-create-expense-modal',
            );
          },
        });
      }
    }

    if (row.status !== TransactionsImportRowStatus.IGNORED && row.status !== TransactionsImportRowStatus.ON_HOLD) {
      actions.primary.push({
        key: 'on-hold',
        Icon: PauseCircle,
        onClick: () => setRowsStatus([row.id], TransactionsImportRowStatus.ON_HOLD),
        disabled: isUpdatingRow,
        label: (
          <div>
            <FormattedMessage defaultMessage="Put on Hold" id="+pCc8I" />
            {isUpdatingRow && <StyledSpinner size={14} ml={2} />}
          </div>
        ),
      });
    }

    actions.primary.push({
      key: 'ignore',
      Icon: row.status === TransactionsImportRowStatus.IGNORED ? ArchiveRestore : SquareSlashIcon,
      onClick: () =>
        setRowsStatus(
          [row.id],
          row.status === TransactionsImportRowStatus.IGNORED
            ? TransactionsImportRowStatus.PENDING
            : TransactionsImportRowStatus.IGNORED,
        ),
      disabled: isUpdatingRow,
      label: (
        <div>
          {row.status === TransactionsImportRowStatus.IGNORED ? (
            <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
          ) : (
            <FormattedMessage defaultMessage="No action" id="zue9QR" />
          )}
          {isUpdatingRow && <StyledSpinner size={14} ml={2} />}
        </div>
      ),
    });

    return actions;
  };

  return { getActions, setRowsStatus };
};
