import React from 'react';

import { hasHosting } from '@/lib/account';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';
import { HostContributionsReports } from '../contributions/reports/HostContributionsReports';
import { HostExpensesReport } from '../expenses/reports/HostExpensesReport';

import AccountTransactionReports from './AccountTransactionReports';
import HostTransactionsReports from './HostTransactionReports';

const Reports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  const reportType = subpath[0];

  if (reportType === 'expenses' && hasHosting(account)) {
    return <HostExpensesReport accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  } else if (reportType === 'contributions' && hasHosting(account)) {
    return <HostContributionsReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  } else {
    if (hasHosting(account)) {
      return <HostTransactionsReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
    }

    return <AccountTransactionReports accountSlug={accountSlug} subpath={subpath.slice(1)} />;
  }
};

export default Reports;
