import React from 'react';

import { isIndividualAccount, isOrganizationAccount } from '@/lib/account';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { DefaultOverview } from './DefaultOverview';
import { HostOverview } from './HostOverview';
import IndividualOverview from './IndividualOverview';
import { SimpleOrgOverview } from './SimpleOrgOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);

  // Individual Overview
  if (isIndividualAccount(account)) {
    return <IndividualOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  if (isOrganizationAccount(account) && account.hasHosting) {
    return <HostOverview accountSlug={accountSlug} />;
  }

  // Simple orgs (i.e. orgs without money management)
  if (isOrganizationAccount(account) && !account.hasMoneyManagement) {
    return <SimpleOrgOverview accountSlug={accountSlug} />;
  }

  // Collectives, projects, events, funds
  // AND money managing orgs (i.e. previously known as self hosted collectives)
  return <DefaultOverview accountSlug={accountSlug} subpath={subpath} />;
}
