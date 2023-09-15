import React, { useEffect } from 'react';
import { useApolloClient, useLazyQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { getVariableFromProps } from '../../pages/expense';
import { Drawer } from '../Drawer';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';
import { VIEWPORTS, useWindowResize } from '../../lib/hooks/useWindowResize';
import clsx from 'clsx';

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

  const { viewport } = useWindowResize();
  const isXl = viewport === VIEWPORTS.XLARGE;
  console.log({ viewport });
  useEffect(() => {
    if (openExpenseLegacyId) {
      getExpense({ variables: getVariableFromProps({ ExpenseId: openExpenseLegacyId }) });
    }
  }, [openExpenseLegacyId]);

  return (
    <React.Fragment>
      {/* {isXl ? (
        <div
          className={clsx(
            'sticky top-[110px] -mr-6 -mt-6 hidden max-h-[calc(100vh-110px)] w-[600px] shrink-0 overflow-y-auto border-l-[3px] p-6 xl:block',
            !openExpenseLegacyId && 'bg-slate-50',
          )}
        >
          {openExpenseLegacyId ? (
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
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              No expense selected
            </div>
          )}
        </div>
      ) : ( */}
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
        />
      </Drawer>
      {/* )} */}
    </React.Fragment>
  );
}
