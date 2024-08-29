import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostVirtualCardRequests from '../../../components/dashboard/sections/HostVirtualCardRequests';

export default function HostVirtualCardRequestsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostVirtualCardRequests}
      slug={router.query.slug}
      section={SECTIONS.HOST_VIRTUAL_CARD_REQUESTS}
    />
  );
}
