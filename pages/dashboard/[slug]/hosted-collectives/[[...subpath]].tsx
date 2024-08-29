import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import HostedCollectives from '../../../../components/dashboard/sections/collectives/HostedCollectives';

export default function HostedCollectivesPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostedCollectives}
      slug={router.query.slug}
      section={SECTIONS.HOSTED_COLLECTIVES}
      subpath={router.query.subpath || []}
    />
  );
}
