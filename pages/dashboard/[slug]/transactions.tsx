import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import AccountTransactions from '../../../components/dashboard/sections/transactions/AccountTransactions';

export default function TransactionsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={AccountTransactions}
      slug={router.query.slug}
      section={SECTIONS.TRANSACTIONS}
    />
  );
}
