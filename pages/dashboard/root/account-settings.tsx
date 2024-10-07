import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import AccountSettings from '../../../components/root-actions/AccountSettings';

export default function RootAccountSettingsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={AccountSettings}
        slug={'root-actions'}
        section={ROOT_SECTIONS.ACCOUNT_SETTINGS}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.ACCOUNT_SETTINGS} />
    );
  }
}
