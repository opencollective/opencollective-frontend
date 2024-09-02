import React from 'react';

import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';
import { ContributionsList } from '../../../../../components/crowdfunding-redesign/ContributionsList';

// next.js export
// ts-unused-exports:disable-next-line
export default function EventFundraisingPage() {
  return (
    <FundraiserLayout activeTab="updates">
      <ContributionsList />
    </FundraiserLayout>
  );
}
