import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import Vendors from '../../../components/dashboard/sections/Vendors';

export default function AccountsPage(props) {
  const router = useRouter();
  return <DashboardPage {...props} Component={Vendors} slug={router.query.slug} section={SECTIONS.VENDORS} />;
}
