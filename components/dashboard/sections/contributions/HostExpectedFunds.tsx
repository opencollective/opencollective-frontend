import React from 'react';

import type { DashboardSectionProps } from '../../types';

import Contributions from './Contributions';

function IncomingExpectedFunds(props: DashboardSectionProps) {
  return <Contributions {...props} direction="INCOMING" onlyExpectedFunds includeHostedAccounts />;
}

export default IncomingExpectedFunds;
