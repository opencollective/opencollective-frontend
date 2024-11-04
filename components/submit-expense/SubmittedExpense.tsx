import React from 'react';
import { useQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { ExpensePageQuery, ExpensePageQueryVariables } from '../../lib/graphql/types/v2/graphql';

import ExpenseSummary from '../expenses/ExpenseSummary';
import { expensePageQuery } from '../expenses/graphql/queries';
import CreateExpenseFAQ from '../faqs/CreateExpenseFAQ';
import Loading from '../Loading';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';

type SubmittedExpenseProps = {
  expenseId: number;
};

export function SubmittedExpense(props: SubmittedExpenseProps) {
  const query = useQuery<ExpensePageQuery, ExpensePageQueryVariables>(expensePageQuery, {
    context: API_V2_CONTEXT,
    skip: !props.expenseId,
    variables: {
      legacyExpenseId: props.expenseId,
    },
  });

  if (query.loading) {
    return <Loading />;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  const expense = query.data?.expense;

  return (
    <div className="flex flex-grow flex-wrap gap-8 px-4 sm:p-0">
      <div className="flex-grow">
        <ExpenseSummary
          onDelete={() => {}}
          onEdit={() => {}}
          openFileViewer={() => {}}
          enableKeyboardShortcuts={false}
          drawerActionsContainer={null}
          canEditTags={false}
          isEditing={false}
          isLoadingLoggedInUser={false}
          showProcessButtons={false}
          expense={expense}
          host={expense?.host}
          isLoading={!expense}
          collective={expense?.account}
        />
      </div>
      <div className="md:max-w-96">
        <CreateExpenseFAQ defaultOpen />
      </div>
    </div>
  );
}
