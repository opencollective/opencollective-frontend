import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import SubmittedExpenses from '../../../components/dashboard/sections/expenses/SubmittedExpenses';

export default function SubmittedExpensesPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={SubmittedExpenses}
      slug={router.query.slug}
      section={SECTIONS.SUBMITTED_EXPENSES}
    />
  );
}
