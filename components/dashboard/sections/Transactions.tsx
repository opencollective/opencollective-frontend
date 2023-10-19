import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { transactionsPageQuery } from '../../../pages/transactions';
import TransactionsPage, { getVariablesFromQuery } from '../../transactions/TransactionsPageContent';
import { DashboardSectionProps } from '../types';

const Transactions = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const variables = { slug: accountSlug, ...getVariablesFromQuery(router.query) };
  const { LoggedInUser } = useLoggedInUser();

  const { data, error, loading, refetch } = useQuery(transactionsPageQuery, {
    variables,
    context: API_V2_CONTEXT,
  });
  const { transactions, account } = data || {};

  return (
    <TransactionsPage
      transactions={transactions}
      account={account}
      variables={variables}
      LoggedInUser={LoggedInUser}
      error={error}
      loading={loading}
      refetch={refetch}
      router={router}
      isDashboard
    />
  );
};

export default Transactions;
