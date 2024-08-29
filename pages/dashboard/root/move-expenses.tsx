import React from 'react';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Loading from '../../../components/Loading';
import MoveExpenses from '../../../components/root-actions/MoveExpenses';

export default function RootMoveExpensesPage(props) {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage {...props} Component={MoveExpenses} slug={'root-actions'} section={ROOT_SECTIONS.MOVE_EXPENSES} />
    );
  } else {
    return <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.MOVE_EXPENSES} />;
  }
}
