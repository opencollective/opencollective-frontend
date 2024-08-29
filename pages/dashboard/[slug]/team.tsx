import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Team from '../../../components/dashboard/sections/Team';

export default function TeamPage(props) {
  const router = useRouter();
  return <DashboardPage {...props} Component={Team} slug={router.query.slug} section={SECTIONS.TEAM} />;
}
