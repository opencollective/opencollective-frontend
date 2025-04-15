import React from 'react';

import type { DashboardSectionProps } from '../../types';

import HostTransactionReport from './HostTransactionReport';
import HostTransactionReportList from './HostTransactionReportsList';

interface HostDashboardReportsProps {
  accountSlug: string;
}

const HostDashboardReports = ({
  accountSlug: hostSlug,
  subpath
}: HostDashboardReportsProps) => {
  if (subpath[0]) {
    return <HostTransactionReport accountSlug={hostSlug} subpath={subpath} />;
  }

  return <HostTransactionReportList accountSlug={hostSlug} />;
};

export default HostDashboardReports;
