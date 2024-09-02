import React from 'react';

import { AccountFinances } from '../../../../../components/crowdfunding-redesign/AccountFinances';
import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function ProjectFinances() {
  return (
    <FundraiserLayout activeTab="finances">
      <AccountFinances inFundraiserLayout />
    </FundraiserLayout>
  );
}
