import React from 'react';

import { isHostAccount, isIndividualAccount } from '../../../../lib/collective';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { CollectiveOverview } from './CollectiveOverview';
import { HostOverview } from './HostOverview';
import IndividualOverview from './IndividualOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);

  if (isIndividualAccount(account)) {
    return <IndividualOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  if (isHostAccount(account)) {
    return <HostOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  return <CollectiveOverview accountSlug={accountSlug} subpath={subpath} />;
}
