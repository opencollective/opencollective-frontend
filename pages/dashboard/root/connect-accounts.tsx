import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import ConnectAccountsForm from '../../../components/root-actions/ConnectAccountsForm';

export default function RootConnectAccountsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={ConnectAccountsForm}
        slug={'root-actions'}
        section={ROOT_SECTIONS.CONNECT_ACCOUNTS}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.CONNECT_ACCOUNTS} />
    );
  }
}
