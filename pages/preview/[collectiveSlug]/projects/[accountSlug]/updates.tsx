import React from 'react';

import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';
import { UpdatesList } from '../../../../../components/crowdfunding-redesign/updates/UpdatesList';

export default function ProjectFundraisingPage() {
  return (
    <FundraiserLayout activeTab="updates">
      <UpdatesList />
    </FundraiserLayout>
  );
}
