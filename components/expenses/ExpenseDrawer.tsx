import React, { useEffect } from 'react';
import { useApolloClient, useLazyQuery } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { getVariableFromProps } from '../../pages/expense';
import Drawer from '../Drawer';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';

export const SummaryHeader = styled.span`
  > a {
    color: inherit;
    text-decoration: underline;
    outline: none;
    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

export default function ExpenseDrawer({
  open,
  handleClose,
  expense,
}: {
  open: boolean;
  handleClose: () => void;
  expense?: { legacyId: number };
}) {
  const client = useApolloClient();
  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore }] = useLazyQuery(
    expensePageQuery,
    {
      variables: getVariableFromProps({ legacyExpenseId: expense?.legacyId }),
      context: API_V2_CONTEXT,
    },
  );

  useEffect(() => {
    if (open) {
      getExpense();
    }
  }, [open]);

  return (
    <Drawer open={open} onClose={handleClose} showActionsContainer>
      <Expense
        data={{ ...data, expense: { ...expense, ...data?.expense } }}
        // Making sure to initially set loading to true before the query is called
        loading={loading || (!data && !error)}
        error={error}
        refetch={refetch}
        client={client}
        fetchMore={fetchMore}
        legacyExpenseId={expense?.legacyId}
        startPolling={startPolling}
        stopPolling={stopPolling}
      />
    </Drawer>
  );
}
