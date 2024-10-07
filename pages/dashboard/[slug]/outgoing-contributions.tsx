import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import OutgoingContributions from '../../../components/dashboard/sections/contributions/OutgoingContributions';

export default function OutgoingContributionsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={OutgoingContributions}
      slug={router.query.slug}
      section={SECTIONS.OUTGOING_CONTRIBUTIONS}
    />
  );
}
