import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import BanAccount from '../../../components/root-actions/BanAccounts';

export default function RootBanAccountPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage {...props} Component={BanAccount} slug={'root-actions'} section={ROOT_SECTIONS.BAN_ACCOUNTS} />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.BAN_ACCOUNTS} />;
  }
}
