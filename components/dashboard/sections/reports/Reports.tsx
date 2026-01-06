import React from 'react';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';
import { HostExpensesReport } from '../expenses/reports/HostExpensesReport';

import AccountTransactionReports from './AccountTransactionReports';
import HostTransactionsReports from './HostTransactionReports';

const Reports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  const hasHosting = account?.hasHosting;

  const reportType = subpath[0];

  if (reportType === 'expenses' && hasHosting) {
    return <HostExpensesReport accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  } else {
    if (hasHosting) {
      return <HostTransactionsReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
    }

    return <AccountTransactionReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  }
};

export default Reports;
