import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import MoveAuthoredContributions from '../../../components/root-actions/MoveAuthoredContributions';

export default function RootMoveAuthoredContributionsPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={MoveAuthoredContributions}
        slug={'root-actions'}
        section={ROOT_SECTIONS.MOVE_AUTHORED_CONTRIBUTIONS}
      />
    );
  } else {
    return (
      <DashboardPage
        {...props}
        Component={Loading}
        slug={'root-actions'}
        section={ROOT_SECTIONS.MOVE_AUTHORED_CONTRIBUTIONS}
      />
    );
  }
}
