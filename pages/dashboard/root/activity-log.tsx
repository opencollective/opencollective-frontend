import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ALL_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import RootActivityLog from '../../../components/root-actions/RootActivityLog';

export default function RootHostTransactionsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage {...props} Component={RootActivityLog} slug={'root-actions'} section={ALL_SECTIONS.ACTIVITY_LOG} />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ALL_SECTIONS.ACTIVITY_LOG} />;
  }
}
