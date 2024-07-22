import React, { useEffect } from 'react';
import { useApolloClient, useLazyQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

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
  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore }] = useLazyQuery(
    expensePageQuery,
    {
      context: API_V2_CONTEXT,
    },
  );

  useEffect(() => {
    if (openExpenseLegacyId) {
      getExpense({ variables: getVariablesFromQuery({ ExpenseId: openExpenseLegacyId }) });
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
      />
    </Drawer>
  );
}
