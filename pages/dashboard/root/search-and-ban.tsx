import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import BanAccountsWithSearch from '../../../components/root-actions/BanAccountsWithSearch';

export default function RootSearchAndBanPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={BanAccountsWithSearch}
        slug={'root-actions'}
        section={ROOT_SECTIONS.SEARCH_AND_BAN}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.SEARCH_AND_BAN} />
    );
  }
}
