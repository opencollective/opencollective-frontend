import React from 'react';

import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';
import { FundraisingPage } from '../../../../../components/crowdfunding-redesign/FundraisingPage';

// next.js export
// ts-unused-exports:disable-next-line
export default function ProjectFundraisingPage() {
  return (
    <FundraiserLayout activeTab="fundraiser">
      <FundraisingPage />
    </FundraiserLayout>
  );
}
