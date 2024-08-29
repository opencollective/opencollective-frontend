import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import RecurringContributions from '../../../components/root-actions/RecurringContributions';

export default function RootRecurringContributionsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={RecurringContributions}
        slug={'root-actions'}
        section={ROOT_SECTIONS.RECURRING_CONTRIBUTIONS}
      />
    );
  } else {
    return (
      <DashboardPage
        {...props}
        Component={Loading}
        slug={'root-actions'}
        section={ROOT_SECTIONS.RECURRING_CONTRIBUTIONS}
      />
    );
  }
}
