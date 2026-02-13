import React from 'react';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import IncomingContributionsForHosted from './IncomingContributionsForHosted';
import IncomingContributionsForOrganizations from './IncomingContributionsForOrganizations';

const IncomingContributions = ({ accountSlug }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  if (account.type === 'ORGANIZATION') {
    return <IncomingContributionsForOrganizations accountSlug={accountSlug} />;
  } else {
    return <IncomingContributionsForHosted accountSlug={accountSlug} />;
  }
};

export default IncomingContributions;
