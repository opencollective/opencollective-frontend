import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import ClearCacheForAccountForm from '../../../components/root-actions/ClearCacheForAccountForm';

export default function RootClearCachePage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={ClearCacheForAccountForm}
        slug={'root-actions'}
        section={ROOT_SECTIONS.CLEAR_CACHE}
      />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.CLEAR_CACHE} />;
  }
}
