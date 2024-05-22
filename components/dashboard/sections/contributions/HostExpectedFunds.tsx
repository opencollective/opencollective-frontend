import React from 'react';

import { DashboardSectionProps } from '../../types';

import Contributions from './Contributions';

function IncomingExpectedFunds(props: DashboardSectionProps) {
  return <Contributions {...props} direction="INCOMING" onlyExpectedFunds includeHostedAccounts />;
}

export default IncomingExpectedFunds;
