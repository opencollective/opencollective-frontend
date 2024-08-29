import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostDashboardTaxForms from '../../../components/dashboard/sections/legal-documents/HostDashboardTaxForms';

export default function HostTaxFormsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostDashboardTaxForms}
      slug={router.query.slug}
      section={SECTIONS.HOST_TAX_FORMS}
    />
  );
}
