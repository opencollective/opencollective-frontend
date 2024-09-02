import React from 'react';

import { ContributionsList } from '../../../../../components/crowdfunding-redesign/ContributionsList';
import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function EventFundraisingPage() {
  return (
    <FundraiserLayout activeTab="updates">
      <ContributionsList />
    </FundraiserLayout>
  );
}
