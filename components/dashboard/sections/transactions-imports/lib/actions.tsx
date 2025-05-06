import React from 'react';
import { useMutation } from '@apollo/client';
import { cloneDeep, pick, uniq, update } from 'lodash';
import { ArchiveRestore, Banknote, Merge, PauseCircle, Receipt, SquareSlashIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../../lib/actions/types';
import { i18nGraphqlException } from '../../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import type { TransactionsImportRow } from '../../../../../lib/graphql/types/v2/schema';
import { TransactionsImportRowStatus } from '../../../../../lib/graphql/types/v2/schema';
import type { UpdateTransactionsImportRowMutation } from '@/lib/graphql/types/v2/graphql';

import { useModal } from '../../../../ModalContext';
import StyledSpinner from '../../../../StyledSpinner';
import { useToast } from '../../../../ui/useToast';
import { HostCreateExpenseModal } from '../../expenses/HostCreateExpenseModal';
import { AddFundsModalFromImportRow } from '../AddFundsModalFromTransactionsImportRow';
import { MatchContributionDialog } from '../MatchContributionDialog';
import { MatchExpenseDialog } from '../MatchExpenseDialog';

import { updateTransactionsImportRows } from './graphql';

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

export const useTransactionsImportActions = ({
  host,
  getAllRowsIds,
}: {
  host: React.ComponentProps<typeof MatchContributionDialog>['host'] &
    React.ComponentProps<typeof MatchExpenseDialog>['host'];
  /** A function to get all rows IDs regardless of pagination, to work with the `includeAllPages` option */
  getAllRowsIds: () => Promise<string[]>;
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
  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
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
        optimisticResponse: getOptimisticResponse(host, rowIds, newStatus), // TODO: Not working yet
      });

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
