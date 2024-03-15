import React from 'react';
import PropTypes from 'prop-types';

import { DashboardSectionProps } from '../../../types';

import HostTransactionReport from './HostTransactionReport';
import HostTransactionReportList from './HostTransactionReportsList';

const HostDashboardReports = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  if (subpath[0]) {
    return <HostTransactionReport accountSlug={hostSlug} subpath={subpath} />;
  }

  return <HostTransactionReportList accountSlug={hostSlug} />;
};

HostDashboardReports.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default HostDashboardReports;
