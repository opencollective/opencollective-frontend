import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import Updates from '../../../../components/dashboard/sections/updates';

export default function UpdatesPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={Updates}
      slug={router.query.slug}
      section={SECTIONS.UPDATES}
      subpath={router.query.subpath || []}
    />
  );
}
