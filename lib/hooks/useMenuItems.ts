import React from 'react';
import { useIntl } from 'react-intl';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { buildMenuItems } from '@/components/dashboard/menu-items';

import useAccountTodo from './useAccountTodo';
import useLoggedInUser from './useLoggedInUser';

const useMenuItems = () => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { account, isRootDashboard } = React.useContext(DashboardContext);
  const { counts: accountTodoCounts } = useAccountTodo(account, { skip: isRootDashboard });

  return React.useMemo(
    () => buildMenuItems({ intl, account, LoggedInUser, isRootDashboard, accountTodoCounts }),
    [intl, account, LoggedInUser, isRootDashboard, accountTodoCounts],
  );
};

export default useMenuItems;
