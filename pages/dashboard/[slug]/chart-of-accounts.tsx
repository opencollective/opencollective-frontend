import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import { HostAdminAccountingSection } from '../../../components/dashboard/sections/accounting';

export default function ChartOfAccountsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostAdminAccountingSection}
      slug={router.query.slug}
      section={SECTIONS.CHART_OF_ACCOUNTS}
    />
  );
}
