import React from 'react';
import PropTypes from 'prop-types';

import { DashboardSectionProps } from '../../../types';

import AccountTransactionReport from './AccountTransactionReport';
import AccountTransactionReportsList from './AccountTransactionReportsList';

const AccountReports = ({ accountSlug, subpath }: DashboardSectionProps) => {
  if (subpath[0]) {
    return <AccountTransactionReport accountSlug={accountSlug} subpath={subpath} />;
  }

  return <AccountTransactionReportsList accountSlug={accountSlug} />;
};

AccountReports.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default AccountReports;
