import React from 'react';
import { useRouter } from 'next/router';

import { ALL_SECTIONS } from '../../../components/dashboard/constants';
import { DashboardContext } from '../../../components/dashboard/DashboardContext';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import InvoicesReceipts from '../../../components/dashboard/sections/invoices-receipts/InvoicesReceipts';

export default function InvoicesReceiptsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={DashboardComponent}
      slug={router.query.slug}
      section={ALL_SECTIONS.INVOICES_RECEIPTS}
      subpath={router.query.subpath || []}
    />
  );
}

function DashboardComponent() {
  const { account } = React.useContext(DashboardContext);

  return <InvoicesReceipts account={account} />;
}
