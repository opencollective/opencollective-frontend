import React from 'react';

import Loading from '../../../../Loading';
import { DashboardContext } from '../../../DashboardContext';
import type { DashboardSectionProps } from '../../../types';
import { HostExpensesReport } from '../../expenses/reports/HostExpensesReport';

import AccountReports from './AccountReports';
import HostReports from './HostReports';

const Reports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  if (!account) {
    return <Loading />;
  }

  const reportType = subpath[0];

  if (reportType === 'transactions') {
    if (account.isHost) {
      return <HostReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
    }

    return <AccountReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  } else {
    return <HostExpensesReport accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  }
};

export default Reports;
