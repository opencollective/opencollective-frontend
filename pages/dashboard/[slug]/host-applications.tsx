import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostApplications from '../../../components/dashboard/sections/collectives/HostApplications';

export default function HostApplicationsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostApplications}
      slug={router.query.slug}
      section={SECTIONS.HOST_APPLICATIONS}
    />
  );
}
