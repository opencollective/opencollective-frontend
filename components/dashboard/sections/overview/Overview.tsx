import React from 'react';

import { hasAccountMoneyManagement, isIndividualAccount } from '../../../../lib/collective';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { DefaultOverview } from './DefaultOverview';
import { HostOverview } from './HostOverview';
import IndividualOverview from './IndividualOverview';
import { SimpleOrgOverview } from './SimpleOrgOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const hasMoneyManagement = hasAccountMoneyManagement(account);

  // Individual Overview
  if (isIndividualAccount(account)) {
    return <IndividualOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  // Host Overview
  if (account.type === 'ORGANIZATION' && account.hasHosting) {
    return <HostOverview accountSlug={accountSlug} />;
  }

  // Simple orgs (i.e. orgs without money management)
  if (account.type === 'ORGANIZATION' && !hasMoneyManagement) {
    return <SimpleOrgOverview accountSlug={accountSlug} />;
  }

  // Collectives, projects, events, funds
  // AND money managing orgs (i.e. previously known as self hosted collectives)
  return <DefaultOverview accountSlug={accountSlug} subpath={subpath} />;
}
