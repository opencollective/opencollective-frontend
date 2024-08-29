import React from 'react';
import { useRouter } from 'next/router';

import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import { SECTIONS } from '../../../../components/dashboard/constants';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import HostDashboardReports from '../../../../components/dashboard/sections/reports/HostDashboardReports';
import PreviewReports from '../../../../components/dashboard/sections/reports/preview/Reports';
import type { DashboardSectionProps } from '../../../../components/dashboard/types';
import Loading from '../../../../components/Loading';

export default function ReportsPage(props) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  let Component: React.FC<DashboardSectionProps>;

  if (!LoggedInUser) {
    Component = Loading;
  } else if (LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.HOST_REPORTS)) {
    Component = PreviewReports;
  } else {
    Component = HostDashboardReports;
  }

  return (
    <DashboardPage
      {...props}
      Component={Component}
      slug={router.query.slug}
      section={SECTIONS.REPORTS}
      subpath={router.query.subpath || []}
    />
  );
}
