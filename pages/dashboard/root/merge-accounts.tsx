import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import MergeAccountsForm from '../../../components/root-actions/MergeAccountsForm';

export default function RootMergeAccountsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={MergeAccountsForm}
        slug={'root-actions'}
        section={ROOT_SECTIONS.MERGE_ACCOUNTS}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.MERGE_ACCOUNTS} />
    );
  }
}
