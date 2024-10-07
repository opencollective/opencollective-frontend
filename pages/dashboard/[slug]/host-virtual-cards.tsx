import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import HostVirtualCards from '../../../components/dashboard/sections/HostVirtualCards';

export default function HostVirtualCardsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={HostVirtualCards}
      slug={router.query.slug}
      section={SECTIONS.HOST_VIRTUAL_CARDS}
    />
  );
}
