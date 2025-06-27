import React from 'react';

import { isIndividualAccount } from '../../../../lib/collective';

import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { CollectiveOverview } from './CollectiveOverview';
import IndividualOverview from './IndividualOverview';
import { OrgOverview } from './OrgOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);

  if (isIndividualAccount(account)) {
    return <IndividualOverview accountSlug={accountSlug} subpath={subpath} />;
  }

  if (account.type === 'ORGANIZATION') {
    return <OrgOverview />;
  }

  return <CollectiveOverview accountSlug={accountSlug} subpath={subpath} />;
}
