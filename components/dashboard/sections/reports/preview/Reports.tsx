import React from 'react';

import { DashboardContext } from '../../../DashboardContext';
import { DashboardSectionProps } from '../../../types';

import AccountReports from './AccountReports';
import HostReports from './HostReports';

const Reports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  if (account.isHost) {
    return <HostReports accountSlug={accountSlug} subpath={subpath} />;
  }

  return <AccountReports accountSlug={accountSlug} subpath={subpath} />;
};

export default Reports;
