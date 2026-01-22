import React from 'react';
import { useApolloClient, useQuery } from '@apollo/client';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../lib/hooks/usePrevious';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { getVariablesFromQuery } from '../../pages/expense';
import { EmptyResults } from '../dashboard/EmptyResults';
import { Drawer } from '../Drawer';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';

type ExpenseDrawerProps = {
  handleClose: () => void;
  openExpenseLegacyId?: number;
  initialExpenseValues?: Record<string, unknown>;
  /**
   * A set of rules that the expense must pass to be displayed in the drawer, used to address
   * Insecure Direct Object Reference (IDOR) vulnerabilities.
   */
  validate?: {
    accountSlug?: string;
    expenseType?: string;
  };
};

export default function ExpenseDrawer({
  openExpenseLegacyId,
  handleClose,
  initialExpenseValues,
  validate,
}: ExpenseDrawerProps) {
  const client = useApolloClient();
  const { LoggedInUser } = useLoggedInUser();
  const prevExpenseId = usePrevious(openExpenseLegacyId);
  const id = openExpenseLegacyId || prevExpenseId;

  const { data, loading, error, refetch, fetchMore, startPolling, stopPolling } = useQuery(expensePageQuery, {
    variables: id ? getVariablesFromQuery({ ExpenseId: id }) : undefined,
    skip: !id,

    fetchPolicy: 'cache-and-network',
  });
  const hasKeyboardShortcutsEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS);
  const passesValidations = React.useMemo(() => {
    if (!validate || (!data?.expense && !loading && !error)) {
      return true;
    } else {
      return (
        data?.expense &&
        (!validate.accountSlug || validate.accountSlug === data.expense.account.slug) &&
        (!validate.expenseType || validate.expenseType === data.expense.type)
      );
    }
  }, [validate, data, loading, error]);

  return (
    <Drawer
      showCloseButton
      open={Boolean(openExpenseLegacyId)}
      onClose={handleClose}
      showActionsContainer
      data-cy="expense-drawer"
      className="max-w-3xl"
    >
      {passesValidations ? (
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
      ) : (
        <div className="flex h-full items-center justify-center">
          <EmptyResults hasFilters={false} entityType="EXPENSES" />
        </div>
      )}
    </Drawer>
  );
}
