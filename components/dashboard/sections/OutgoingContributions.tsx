import React from 'react';

import { DashboardSectionProps } from '../types';

import Contributions from './Contributions';

const OutgoingContributions = (props: DashboardSectionProps) => {
  return <Contributions {...props} direction="OUTGOING" />;
};

export default OutgoingContributions;
