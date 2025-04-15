import React from 'react';

import type { DashboardSectionProps } from '../../types';

import AccountTransactionReport from './AccountTransactionReport';
import AccountTransactionReportsList from './AccountTransactionReportsList';

interface AccountReportsProps {
  accountSlug: string;
}

const AccountReports = ({
  accountSlug,
  subpath
}: AccountReportsProps) => {
  if (subpath[0]) {
    return <AccountTransactionReport accountSlug={accountSlug} subpath={subpath} />;
  }

  return <AccountTransactionReportsList accountSlug={accountSlug} />;
};

export default AccountReports;
