import React from 'react';

import { hasAccountMoneyManagement, isIndividualAccount } from '../../../../lib/collective';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { DefaultOverview } from './DefaultOverview';
import { HostOverview } from './HostOverview';
import IndividualOverview from './IndividualOverview';
import { SimpleOrgOverview } from './SimpleOrgOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account, workspace } = React.useContext(DashboardContext);
  // Use workspace data (available immediately) for routing decisions, fall back to full account
  const effectiveAccount = account || workspace;
  const hasMoneyManagement = hasAccountMoneyManagement(effectiveAccount);

  if (!effectiveAccount) {
    return null;
  }

  // Individual Overview
  if (isIndividualAccount(effectiveAccount)) {
    return <IndividualOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  // Host Overview
  if (effectiveAccount.type === 'ORGANIZATION' && effectiveAccount.hasHosting) {
    return <HostOverview accountSlug={accountSlug} />;
  }

  // Simple orgs (i.e. orgs without money management)
  if (effectiveAccount.type === 'ORGANIZATION' && !hasMoneyManagement) {
    return <SimpleOrgOverview accountSlug={accountSlug} />;
  }

  // Collectives, projects, events, funds
  // AND money managing orgs (i.e. previously known as self hosted collectives)
  return <DefaultOverview accountSlug={accountSlug} subpath={subpath} />;
}
