import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import AllTransactions from '../../../components/dashboard/sections/transactions/AllTransactions';
import Loading from '../../../components/Loading';

export default function RootHostTransactionsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={AllTransactions}
        slug={'root-actions'}
        section={SECTIONS.HOST_TRANSACTIONS}
      />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={SECTIONS.HOST_TRANSACTIONS} />;
  }
}
