import React from 'react';
import { useMutation } from '@apollo/client';
import { cloneDeep, pick, uniq, update } from 'lodash';
import { ArchiveRestore, Banknote, Merge, PauseCircle, Receipt, SquareSlashIcon, Unlink } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../../lib/actions/types';
import { i18nGraphqlException } from '../../../../../lib/errors';
import type { TransactionsImportRow } from '../../../../../lib/graphql/types/v2/schema';
import { TransactionsImportRowStatus } from '../../../../../lib/graphql/types/v2/schema';
import type { UpdateTransactionsImportRowMutation } from '@/lib/graphql/types/v2/graphql';

import { useModal } from '../../../../ModalContext';
import Spinner from '../../../../Spinner';
import { useToast } from '../../../../ui/useToast';
import { HostCreateExpenseModal } from '../../expenses/HostCreateExpenseModal';
import { AddFundsModalFromImportRow } from '../AddFundsModalFromTransactionsImportRow';
import { MatchCreditDialog } from '../MatchCreditDialog';
import { MatchDebitDialog } from '../MatchDebitDialog';
import { UnlinkTransactionImportRowDialog } from '../UnlinkTransactionImportRowDialog';

import { updateTransactionsImportRows } from './graphql';

const getOptimisticResponse = (
  host,
  rowIds,
  status: TransactionsImportRowStatus,
): UpdateTransactionsImportRowMutation => {
  type ReturnedHost = UpdateTransactionsImportRowMutation['updateTransactionsImportRows']['host'];
  const optimisticResult = {
    __typename: 'TransactionsImportEditResponse',
    rows: rowIds.map(id => ({ id, status, __typename: 'TransactionsImportRow' })),
    host: cloneDeep(
      pick<ReturnedHost, 'id' | 'offPlatformTransactionsStats' | '__typename'>(host, [
        'id',
        'offPlatformTransactionsStats',
        '__typename',
      ]),
    ),
  } as const;

  // Update stats
  if (status === TransactionsImportRowStatus.IGNORED) {
    update(optimisticResult, 'host.offPlatformTransactionsStats.ignored', ignored => ignored + rowIds.length);
    update(optimisticResult, 'host.offPlatformTransactionsStats.processed', processed => processed + rowIds.length);
  } else if (status === TransactionsImportRowStatus.PENDING) {
    update(optimisticResult, 'host.offPlatformTransactionsStats.ignored', ignored => ignored - rowIds.length);
    update(optimisticResult, 'host.offPlatformTransactionsStats.processed', processed => processed - rowIds.length);
  }

  return {
    updateTransactionsImportRows: optimisticResult,
  };
};

export const useTransactionsImportActions = ({
  host,
  getAllRowsIds,
  onUpdateSuccess,
  skipOptimisticResponse,
}: {
  host: React.ComponentProps<typeof MatchCreditDialog>['host'] &
    React.ComponentProps<typeof MatchDebitDialog>['host'] &
    React.ComponentProps<typeof AddFundsModalFromImportRow>['host'];
  /** A function to get all rows IDs regardless of pagination, to work with the `includeAllPages` option */
  getAllRowsIds: () => Promise<string[]>;
  onUpdateSuccess?: () => void;
  skipOptimisticResponse?: boolean;
}): {
  getActions: GetActions<TransactionsImportRow>;
  setRowsStatus: (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    options?: { includeAllPages?: boolean },
  ) => Promise<boolean>;
} => {
  const { toast } = useToast();
  const intl = useIntl();
  const [updatingRows, setUpdatingRows] = React.useState<Array<string>>([]);
  const [updateRows] = useMutation(updateTransactionsImportRows);
  const { showModal, hideModal } = useModal();

  const setRowsStatus = async (
    rowIds: string[],
    newStatus: TransactionsImportRowStatus,
    { includeAllPages = false } = {},
  ): Promise<boolean> => {
    setUpdatingRows(uniq([...updatingRows, ...rowIds]));
    try {
      let action: string;
      let allRowsIds = rowIds;
      if (includeAllPages) {
        allRowsIds = await getAllRowsIds();
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
          action,
          rows: allRowsIds.map(id => ({ id, status: newStatus })),
        },
        optimisticResponse: !skipOptimisticResponse ? getOptimisticResponse(host, rowIds, newStatus) : undefined,
      });

      onUpdateSuccess?.();

      return true;
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
      return false;
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
    const assignedAccounts = row.assignedAccounts?.length ? row.assignedAccounts : null;
    const transactionsImport = row.transactionsImport;
    const showAddFundsModal = () => {
      showModal(
        AddFundsModalFromImportRow,
        { host, collective: assignedAccounts, transactionsImport, row, onCloseFocusRef },
        'add-funds-modal',
      );
    };

    if (isImported) {
      const handleRevert = async () => {
        hideModal('unlink-transaction-import-row-modal');
        setUpdatingRows(uniq([...updatingRows, row.id]));
        try {
          const action = 'UNLINK';
          await updateRows({
            variables: {
              action,
              rows: [{ id: row.id }],
            },
            optimisticResponse: !skipOptimisticResponse
              ? getOptimisticResponse(host, [row.id], TransactionsImportRowStatus.PENDING)
              : undefined,
          });

          onUpdateSuccess?.();
          toast({
            variant: 'success',
            message: intl.formatMessage({
              defaultMessage: 'Transaction import row unlinked successfully',
              id: 'UnlinkTransactionImportRowSuccess',
            }),
          });
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        } finally {
          setUpdatingRows(updatingRows.filter(rowId => rowId !== row.id));
        }
      };

      actions.primary.push({
        key: 'revert',
        Icon: Unlink,
        label: <FormattedMessage defaultMessage="Unlink" id="Transaction.Unlink" />,
        disabled: isUpdatingRow,
        onClick: () => {
          showModal(
            UnlinkTransactionImportRowDialog,
            {
              row,
              onConfirm: handleRevert,
            },
            'unlink-transaction-import-row-modal',
          );
        },
      });
      return actions;
    } else if (row.status !== TransactionsImportRowStatus.IGNORED) {
      if (row.amount.valueInCents > 0) {
        actions.primary.push({
          key: 'match',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match" id="Qr9R5O" />,
          disabled: isUpdatingRow,
          onClick: () =>
            showModal(
              MatchCreditDialog,
              {
                host,
                row,
                transactionsImport,
                onCloseFocusRef,
                accounts: assignedAccounts,
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
          key: 'match',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match" id="Qr9R5O" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              MatchDebitDialog,
              { host, row, transactionsImport, onCloseFocusRef, accounts: assignedAccounts },
              'host-match-expense-modal',
            );
          },
        });
        actions.primary.push({
          key: 'create-expense',
          Icon: Receipt,
          label: <FormattedMessage defaultMessage="Create expense" id="YUK+rq" />,
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
            {isUpdatingRow && <Spinner size={14} className="ml-2" />}
          </div>
        ),
      });
    } else {
      actions.primary.push({
        key: 'restore',
        Icon: ArchiveRestore,
        onClick: () => setRowsStatus([row.id], TransactionsImportRowStatus.PENDING),
        disabled: isUpdatingRow,
        label: (
          <div>
            <FormattedMessage defaultMessage="Restore" id="zz6ObK" />
            {isUpdatingRow && <Spinner size={14} className="ml-2" />}
          </div>
        ),
      });
    }

    if (row.status !== TransactionsImportRowStatus.IGNORED) {
      actions.primary.push({
        key: 'ignore',
        Icon: SquareSlashIcon,
        onClick: () => setRowsStatus([row.id], TransactionsImportRowStatus.IGNORED),
        disabled: isUpdatingRow,
        label: (
          <div>
            <FormattedMessage defaultMessage="No action" id="zue9QR" />

            {isUpdatingRow && <Spinner size={14} className="ml-2" />}
          </div>
        ),
      });
    }

    return actions;
  };

  return { getActions, setRowsStatus };
};
