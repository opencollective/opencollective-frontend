import React from 'react';
import { useRouter } from 'next/router';

import { ALL_SECTIONS } from '../../../components/dashboard/constants';
import { DashboardContext } from '../../../components/dashboard/DashboardContext';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import { TaxInformationSettingsSection } from '../../../components/dashboard/sections/tax-information';

export default function TaxInformationPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={DashboardComponent}
      slug={router.query.slug}
      section={ALL_SECTIONS.TAX_INFORMATION}
      subpath={router.query.subpath || []}
    />
  );
}

function DashboardComponent() {
  const { account } = React.useContext(DashboardContext);

  return <TaxInformationSettingsSection account={account} />;
}
