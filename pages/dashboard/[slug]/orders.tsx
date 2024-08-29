import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostFinancialContributions from '../../../components/dashboard/sections/contributions/HostFinancialContributions';

export default function HostFinancialContributionsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostFinancialContributions}
      slug={router.query.slug}
      section={SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS}
    />
  );
}
