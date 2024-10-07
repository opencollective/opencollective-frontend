import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import AccountType from '../../../components/root-actions/AccountType';

export default function RootAccountTypePage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage {...props} Component={AccountType} slug={'root-actions'} section={ROOT_SECTIONS.ACCOUNT_TYPE} />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.ACCOUNT_TYPE} />;
  }
}
