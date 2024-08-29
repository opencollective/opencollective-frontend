import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import Accounts from '../../../../components/dashboard/sections/accounts';

export default function AccountsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={Accounts}
      slug={router.query.slug}
      section={SECTIONS.ACCOUNTS}
      subpath={router.query.subpath || []}
    />
  );
}
