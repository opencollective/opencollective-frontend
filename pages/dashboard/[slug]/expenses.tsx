import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import ReceivedExpenses from '../../../components/dashboard/sections/expenses/ReceivedExpenses';

export default function ExpensesPage(props) {
  const router = useRouter();
  return <DashboardPage {...props} Component={ReceivedExpenses} slug={router.query.slug} section={SECTIONS.EXPENSES} />;
}
