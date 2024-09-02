import React from 'react';

import { Finances } from '../../../../../components/crowdfunding-redesign/finances/Finances';
import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function ProjectFinances() {
  return (
    <FundraiserLayout activeTab="finances">
      <Finances inFundraiserLayout />
    </FundraiserLayout>
  );
}
