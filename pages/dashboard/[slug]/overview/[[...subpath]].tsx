import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import Overview from '../../../../components/dashboard/sections/overview/Overview';

export default function DashboardOverviewPage(props) {
  const router = useRouter();
  return <DashboardPage {...props} Component={Overview} slug={router.query.slug} section={SECTIONS.OVERVIEW} />;
}
