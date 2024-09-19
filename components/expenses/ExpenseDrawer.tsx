import React, { useEffect } from 'react';
import { useApolloClient, useLazyQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { OrderByFieldType, OrderDirection } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { getVariablesFromQuery } from '../../pages/expense';
import { Drawer } from '../Drawer';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';

type ExpenseDrawerProps = {
  handleClose: () => void;
  openExpenseLegacyId?: number;
  initialExpenseValues?: any;
};

export default function ExpenseDrawer({ openExpenseLegacyId, handleClose, initialExpenseValues }: ExpenseDrawerProps) {
  const client = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore }] = useLazyQuery(
    expensePageQuery,
    {
      context: API_V2_CONTEXT,
    },
  );

  const hasKeyboardShortcutsEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS);

  useEffect(() => {
    if (openExpenseLegacyId) {
      getExpense({
        variables: {
          ...getVariablesFromQuery({ ExpenseId: openExpenseLegacyId }),
          orderBy: { field: OrderByFieldType.CREATED_AT, direction: OrderDirection.DESC },
        },
      });
    }
  }, [openExpenseLegacyId]);

  return (
    <Drawer
      showCloseButton
      open={Boolean(openExpenseLegacyId)}
      onClose={handleClose}
      showActionsContainer
      data-cy="expense-drawer"
      className="max-w-3xl"
    >
      <Expense
        data={initialExpenseValues ? { ...data, expense: { ...initialExpenseValues, ...data?.expense } } : data}
        // Making sure to initially set loading to true before the query is called
        loading={loading || (!data && !error)}
        error={error}
        refetch={refetch}
        client={client}
        fetchMore={fetchMore}
        legacyExpenseId={openExpenseLegacyId}
        startPolling={startPolling}
        stopPolling={stopPolling}
        isDrawer
        enableKeyboardShortcuts={hasKeyboardShortcutsEnabled}
      />
    </Drawer>
  );
}
