import React from 'react';

import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';
import { UpdatesList } from '../../../../../components/crowdfunding-redesign/updates/UpdatesList';

// next.js export
// ts-unused-exports:disable-next-line
export default function ProjectFundraisingPage() {
  return (
    <FundraiserLayout activeTab="updates">
      <UpdatesList />
    </FundraiserLayout>
  );
}
