import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import IncomingContributions from '../../../components/dashboard/sections/contributions/IncomingContributions';

export default function IncomingContributionsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={IncomingContributions}
      slug={router.query.slug}
      section={SECTIONS.INCOMING_CONTRIBUTIONS}
    />
  );
}
