import React from 'react';

import { isIndividualAccount } from '../../../../lib/collective';

import Loading from '../../../Loading';
import { DashboardContext } from '../../DashboardContext';
import type { DashboardSectionProps } from '../../types';

import { CollectiveOverview } from './CollectiveOverview';
import IndividualOverview from './IndividualOverview';

export default function Overview({ accountSlug, subpath }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);

  if (!account) {
    return <Loading />;
  }

  if (isIndividualAccount(account)) {
    return <IndividualOverview accountSlug={accountSlug} />;
  }

  return <CollectiveOverview accountSlug={accountSlug} subpath={subpath} />;
}
