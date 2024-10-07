import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import HostTransactions from '../../../../components/dashboard/sections/transactions/HostTransactions';

export default function HostTrasactionsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostTransactions}
      slug={router.query.slug}
      section={SECTIONS.HOST_TRANSACTIONS}
      subpath={router.query.subpath || []}
    />
  );
}
