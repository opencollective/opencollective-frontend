import React from 'react';
import { useRouter } from 'next/router';

import { ALL_SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import NotificationsSettings from '../../../../components/dashboard/sections/NotificationsSettings';

export default function NotificationSettingsPage(props) {
  const router = useRouter();
  return (
    <DashboardPage
      {...props}
      Component={NotificationsSettings}
      slug={router.query.slug}
      section={ALL_SECTIONS.NOTIFICATIONS}
      subpath={router.query.subpath || []}
    />
  );
}
