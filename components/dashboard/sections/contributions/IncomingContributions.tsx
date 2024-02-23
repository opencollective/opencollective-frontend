import React from 'react';

import type { DashboardSectionProps } from '../../types';

import Contributions from './Contributions';

const IncomingContributions = (props: DashboardSectionProps) => {
  return <Contributions {...props} direction="INCOMING" />;
};

export default IncomingContributions;
