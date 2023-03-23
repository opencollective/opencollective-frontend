import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { transactionsPageQuery } from '../../../pages/transactions';
import TransactionsComponent, { getVariablesFromQuery } from '../../transactions/Transactions';
import { AdminSectionProps } from '../types';

const Transactions = (props: AdminSectionProps) => {
  const router = useRouter();
  const variables = { slug: props.account.slug, ...getVariablesFromQuery(router.query) };
  const { LoggedInUser } = useLoggedInUser();

  const { data, error, loading, refetch } = useQuery(transactionsPageQuery, {
    variables,
    context: API_V2_CONTEXT,
  });
  const { transactions, account } = data || {};

  return (
    <React.Fragment>
      <TransactionsComponent
        transactions={transactions}
        account={account}
        variables={variables}
        LoggedInUser={LoggedInUser}
        error={error}
        loading={loading}
        refetch={refetch}
        router={router}
      />
    </React.Fragment>
  );
};

export default Transactions;
