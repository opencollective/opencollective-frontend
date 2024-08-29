import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Contributors from '../../../components/dashboard/sections/Contributors';

export default function ContributorsPage(props) {
  const router = useRouter();
  return <DashboardPage {...props} Component={Contributors} slug={router.query.slug} section={SECTIONS.CONTRIBUTORS} />;
}
