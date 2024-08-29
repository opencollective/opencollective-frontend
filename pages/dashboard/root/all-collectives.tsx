import React from 'react';
import { useRouter } from 'next/router';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { ROOT_SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import AllCollectives from '../../../components/dashboard/sections/collectives/AllCollectives';
import Loading from '../../../components/Loading';

export default function RootAllCollectivesPage(props) {
  const router = useRouter();
  const subpath = router.query.subpath;
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser.isRoot) {
    return (
      <DashboardPage
        {...props}
        Component={AllCollectives}
        slug={'root-actions'}
        section={ROOT_SECTIONS.ALL_COLLECTIVES}
        subpath={subpath}
      />
    );
  } else {
    return (
      <DashboardPage {...props} Component={Loading} slug={'root-actions'} section={ROOT_SECTIONS.ALL_COLLECTIVES} />
    );
  }
}
