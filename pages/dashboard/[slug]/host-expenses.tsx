import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostExpenses from '../../../components/dashboard/sections/expenses/HostDashboardExpenses';

export default function HostExpensesPage(props) {
  const router = useRouter();
  return (
    <DashboardPage {...props} Component={HostExpenses} slug={router.query.slug} section={SECTIONS.HOST_EXPENSES} />
  );
}
