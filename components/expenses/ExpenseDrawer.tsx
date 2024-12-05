import React, { useEffect, useRef } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { getVariablesFromQuery } from '../../pages/expense';
import { Drawer } from '../Drawer';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';
import { usePrevious } from '../../lib/hooks/usePrevious';

type ExpenseDrawerProps = {
  handleClose: () => void;
  openExpenseLegacyId?: number;
  initialExpenseValues?: any;
};

export default function ExpenseDrawer({ openExpenseLegacyId, handleClose, initialExpenseValues }: ExpenseDrawerProps) {
  return (
    <Drawer
      showCloseButton
      open={Boolean(openExpenseLegacyId)}
      onClose={handleClose}
      showActionsContainer
      data-cy="expense-drawer"
      className="max-w-3xl"
    >
      <ExpenseDrawerContent
        initialExpenseValues={initialExpenseValues}
        handleClose={handleClose}
        openExpenseLegacyId={openExpenseLegacyId}
      />
    </Drawer>
  );
}

function ExpenseDrawerContent({ openExpenseLegacyId, handleClose, initialExpenseValues }: ExpenseDrawerProps) {
  const client = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const prevExpenseId = usePrevious(openExpenseLegacyId);
  const id = openExpenseLegacyId || prevExpenseId;

  const { data, loading, error, refetch, fetchMore, startPolling, stopPolling } = useQuery(expensePageQuery, {
    variables: id ? getVariablesFromQuery({ ExpenseId: id }) : undefined,
    skip: !id,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });

  const hasKeyboardShortcutsEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS);
  console.log({ expense: data?.expense });
  return (
    <Expense
      data={initialExpenseValues ? { ...data, expense: { ...initialExpenseValues, ...data?.expense } } : data}
      loading={loading || (!data && !error)}
      error={error}
      refetch={refetch}
      client={client}
      fetchMore={fetchMore}
      legacyExpenseId={id}
      startPolling={startPolling}
      stopPolling={stopPolling}
      isDrawer
      onClose={handleClose}
      enableKeyboardShortcuts={hasKeyboardShortcutsEnabled}
    />
  );
}
