import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import UnhostAccountForm from '../../../components/root-actions/UnhostAccountForm';

export default function RootUnhostAccountsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={UnhostAccountForm}
        slug={'root-actions'}
        section={ROOT_SECTIONS.UNHOST_ACCOUNTS}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.UNHOST_ACCOUNTS} />
    );
  }
}
