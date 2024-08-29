import React from 'react';
import { useRouter } from 'next/router';

import { SECTIONS } from '../../../components/dashboard/constants';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import VirtualCards from '../../../components/dashboard/sections/virtual-cards/VirtualCards';

export default function VirtualCardsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage {...props} Component={VirtualCards} slug={router.query.slug} section={SECTIONS.VIRTUAL_CARDS} />
  );
}
