import React from 'react';
import { useMutation } from '@apollo/client';
import { cloneDeep, uniq, update } from 'lodash';
import { ArchiveRestore, Banknote, Merge, Receipt, SquareSlashIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../../lib/actions/types';
import { i18nGraphqlException } from '../../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import type { TransactionsImportRow } from '../../../../../lib/graphql/types/v2/graphql';

import { useModal } from '../../../../ModalContext';
import StyledSpinner from '../../../../StyledSpinner';
import { useToast } from '../../../../ui/useToast';
import { HostCreateExpenseModal } from '../../expenses/HostCreateExpenseModal';
import { AddFundsModalFromImportRow } from '../AddFundsModalFromTransactionsImportRow';
import { MatchContributionDialog } from '../MatchContributionDialog';

import { updateTransactionsImportRows } from './graphql';

const getOptimisticResponse = (transactionsImport, rowIds, isDismissed) => {
  const optimisticResult = cloneDeep(transactionsImport);

  // Update nodes
  update(optimisticResult, 'rows.nodes', nodes =>
    nodes.map(node => (rowIds.includes(node.id) ? { ...node, isDismissed } : node)),
  );

  // Update stats
  if (isDismissed) {
    update(optimisticResult, 'stats.ignored', ignored => ignored + rowIds.length);
    update(optimisticResult, 'stats.processed', processed => processed + rowIds.length);
  } else {
    update(optimisticResult, 'stats.ignored', ignored => ignored - rowIds.length);
    update(optimisticResult, 'stats.processed', processed => processed - rowIds.length);
  }

  return { updateTransactionsImportRows: optimisticResult };
};

export function useTransactionsImportActions({ transactionsImport, host }): {
  getActions: GetActions<TransactionsImportRow>;
  setRowsDismissed: (rowIds: string[], isDismissed: boolean) => Promise<void>;
} {
  const { toast } = useToast();
  const intl = useIntl();
  const [updatingRows, setUpdatingRows] = React.useState<Array<string>>([]);
  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const { showModal, hideModal } = useModal();
  const setRowsDismissed = async (rowIds: string[], isDismissed: boolean) => {
    setUpdatingRows(uniq([...updatingRows, ...rowIds]));
    try {
      await updateRows({
        variables: {
          importId: transactionsImport.id,
          rows: rowIds.map(id => ({ id, isDismissed })),
        },
        optimisticResponse: getOptimisticResponse(transactionsImport, rowIds, isDismissed),
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
    const showAddFundsModal = () => {
      showModal(AddFundsModalFromImportRow, { transactionsImport, row, onCloseFocusRef }, 'add-funds-modal');
    };

    if (isImported) {
      return actions;
    } else if (!row.isDismissed) {
      if (row.amount.valueInCents > 0) {
        actions.primary.push({
          key: 'match',
          Icon: Merge,
          label: <FormattedMessage defaultMessage="Match expected funds" id="J/7TIn" />,
          disabled: isUpdatingRow,
          onClick: () =>
            showModal(
              MatchContributionDialog,
              {
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
          label: <FormattedMessage defaultMessage="Add funds" id="h9vJHn" />,
          disabled: isUpdatingRow,
          onClick: showAddFundsModal,
        });
      } else if (row.amount.valueInCents < 0) {
        actions.primary.push({
          key: 'create-expense',
          Icon: Receipt,
          label: <FormattedMessage defaultMessage="Add expense" id="6/UjBO" />,
          disabled: isUpdatingRow,
          onClick: () => {
            showModal(
              HostCreateExpenseModal,
              { host, onCloseFocusRef, transactionsImport, transactionsImportRow: row },
              'host-create-expense-modal',
            );
          },
        });
      }
    }

    actions.primary.push({
      key: 'ignore',
      Icon: row.isDismissed ? ArchiveRestore : SquareSlashIcon,
      onClick: () => setRowsDismissed([row.id], !row.isDismissed),
      disabled: isUpdatingRow,
      label: (
        <div>
          {row.isDismissed ? (
            <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
          ) : (
            <FormattedMessage defaultMessage="Ignore" id="paBpxN" />
          )}
          {isUpdatingRow && <StyledSpinner size={14} ml={2} />}
        </div>
      ),
    });

    return actions;
  };

  return { getActions, setRowsDismissed };
}
