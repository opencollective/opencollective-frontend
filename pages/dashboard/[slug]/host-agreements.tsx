import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostDashboardAgreements from '../../../components/dashboard/sections/HostDashboardAgreements';

export default function HostAgreementsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostDashboardAgreements}
      slug={router.query.slug}
      section={SECTIONS.HOST_AGREEMENTS}
    />
  );
}
