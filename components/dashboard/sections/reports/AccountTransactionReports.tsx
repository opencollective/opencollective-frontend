import React from 'react';

import type { DashboardSectionProps } from '../../types';

import AccountTransactionReport from './AccountTransactionReport';
import AccountTransactionReportsList from './AccountTransactionReportsList';

const AccountReports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  if (subpath[0]) {
    return <AccountTransactionReport accountSlug={accountSlug} subpath={subpath} />;
  }

  return <AccountTransactionReportsList accountSlug={accountSlug} />;
};

export default AccountReports;
