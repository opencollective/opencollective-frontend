import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostExpectedFunds from '../../../components/dashboard/sections/contributions/HostExpectedFunds';

export default function ExpectedFunds(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostExpectedFunds}
      slug={router.query.slug}
      section={SECTIONS.HOST_EXPECTED_FUNDS}
    />
  );
}
